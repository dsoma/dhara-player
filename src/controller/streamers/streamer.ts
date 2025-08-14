import type Media from '../../model/media';
import type AdaptationSet from '../../model/adaptation-set';
import type Representation from '../../model/representation';
import type Segment from '../../model/segment';
import type NativePlayer from '../native-player';
import SegmentLoader, { InitSegmentLoader } from '../../services/segment-loader';
import type { IPipeline } from '../../services/segment-loader';
import Buffer from '../buffer';
import type { BufferSink } from '../buffer';
import log from 'loglevel';
import StreamerState from './streamer-state';
import { MediaElement } from '../native-player';
import { StreamType } from '../../model/adaptation-set';

const PROCESS_TICK = 20; // in milliseconds
const MAX_BUFFER_LENGTH = 60; // in seconds
const ABORT_FOR_SEEK = 'abort-for-seek';

/**
 * Streamer is a class that handles the streaming of a media stream.
 * It is responsible for managing the appropriate source buffers for the stream.
 * This is a base class for all streamers.
 */
export default class Streamer {
    protected readonly _streamType: StreamType;
    protected readonly _media: Media;
    protected readonly _nativePlayer: NativePlayer;
    protected readonly _mediaElement: MediaElement;
    protected _adaptationSet: AdaptationSet;
    protected _buffer: Buffer | null = null;
    protected _state: StreamerState;
    protected _timer: NodeJS.Timeout | null = null;
    protected _name: string = this.constructor.name;
    protected _initSegmentLoader: InitSegmentLoader;
    protected _curBufferSink: BufferSink | null = null;
    protected _segmentLoader: SegmentLoader | null = null;

    constructor(streamType: StreamType, media: Media, adaptationSet: AdaptationSet,
        nativePlayer: NativePlayer, adaptationSetIndex: number) {
        this._streamType = streamType;
        this._media = media;
        this._nativePlayer = nativePlayer;
        this._mediaElement = nativePlayer.mediaElement;
        this._adaptationSet = adaptationSet;
        this._initSegmentLoader = new InitSegmentLoader();
        this._state = new StreamerState(adaptationSet, adaptationSetIndex);
    }

    public initialize(): boolean {
        const mimeType = this._adaptationSet.getMimeType();
        const codecs = this._adaptationSet.getCodecs();
        const mimeCodec = `${mimeType}; codecs="${codecs}"`;
        const mediaSource = this._nativePlayer.mediaSource;

        if (!mediaSource) {
            log.warn(`[Streamer] No media source found`);
            return false;
        }

        try {
            if (!MediaSource.isTypeSupported(mimeCodec)) {
                throw new Error(`Media source does not support ${mimeCodec}`);
            }

            this._buffer = new Buffer(this._streamType, mimeCodec, mediaSource);
            this._initSegmentLoader.pipeline = this._getNewPipeline();
        } catch (error) {
            log.error(`[Streamer] Failed to create buffer for ${mimeCodec}`);
            log.error(error);
            return false;
        }

        this._state.initialize(this._media);
        return true;
    }

    public destroy() {
        this._buffer?.destroy();
        this._buffer = null;
        this._initSegmentLoader.destroy();
    }

    public onPlay() {
        log.debug(`[${this._name}] onPlay`);
        if (this._state.seeking) {
            return;
        }

        this.start();
    }

    public onPause() {
        log.debug(`[${this._name}] onPause`);
        this.stop();
    }

    public async onSeeking() {
        this._state.seeking = true;
        const seekPosition = this._currentTime;
        log.debug(`[${this._name}] onSeeking: ${seekPosition}`);

        const targetPosition = this._getTargetPosition(seekPosition);
        const nextSegment = this._getNextSegmentForPosition(targetPosition);
        if (!nextSegment) {
            return;
        }

        this.stop();
        this._abortLoadingIfRequired(nextSegment, ABORT_FOR_SEEK);

        log.debug(`[${this._name}] onSeeking: nextSegment = ${nextSegment.seqNum}`);

        if (this._shouldLoadSegment(nextSegment.seqNum)) {
            await this._loadSegment(nextSegment);
        }

        // this.start();
    }

    public onSeeked() {
        this._state.seeking = false;
        log.debug(`[${this._name}] onSeeked`);
        this.start();
    }

    public onEnded() {
        log.debug(`[${this._name}] onEnded`);
        this.stop();
    }

    public onError(error: Error) {
        log.error(`[${this._name}] onError: ${error}`);
        this.stop();
        this._segmentLoader = null;
    }

    public start() {
        this._timer = setInterval(() => {
            this._process();
        }, PROCESS_TICK);
    }

    public stop() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
    }

    public isBufferClosed(): boolean {
        return this._buffer?.isClosed() ?? true;
    }

    protected _getNewPipeline(): IPipeline {
        if (this._curBufferSink) {
            // Maybe we have to cancel the current sink.
            this._curBufferSink = null;
        }

        this._curBufferSink = this._buffer?.getNewSink() ?? null;

        return {
            sink: this._curBufferSink
        };
    }

    protected _process() {
        const rep = this._determineRepresentation();
        if (!rep) {
            return;
        }

        const nextSegmentNum = this._state.getNextSegmentNumInSequence();
        if (Number.isNaN(nextSegmentNum)) {
            return;
        }

        if (!this._shouldLoadSegment(nextSegmentNum)) {
            return;
        }

        this._loadSegment(this._getSegment(nextSegmentNum));
    }

    protected _determineRepresentation(): Representation | null {
        // At present, hard code the period to 0 and representation index to the last one.
        this._state.repIndex = this._adaptationSet.representations.length - 1;
        return this._state.rep;
    }

    protected _shouldLoadSegment(segmentNum: number): boolean {
        const bufferedLength = this._buffer?.getBufferedLength(this._currentTime) ?? 0;
        if (bufferedLength >= MAX_BUFFER_LENGTH) {
            return false;
        }
        return this._state.shouldLoadSegment(segmentNum);
    }

    protected _abortLoadingIfRequired(segment: Segment, reason: string) {
        if (!segment || this._state.curSegmentNum === segment.seqNum) {
            return;
        }

        this._segmentLoader?.abort(reason);
        this._state.onSegmentLoadAborted();
        this._buffer?.open();
    }

    protected _getNextSegmentForPosition(targetPosition: number): Segment | null {
        if (Number.isNaN(targetPosition)) {
            return null;
        }

        const resolveInfo = this._state.getSegmentResolveInfoForPosition(targetPosition);
        return this._media.getSegmentForPosition(targetPosition, resolveInfo);
    }

    protected _getTargetPosition(seekPosition: number): number {
        let adjustedTargetPosition = seekPosition;

        const buffered = this._buffer?.buffered();
        if (!buffered) {
            return seekPosition;
        }

        for (let i = 0; i < buffered.length; i++) {
            const rangeStart = buffered.start(i);
            const rangeEnd   = buffered.end(i);

            if (seekPosition < rangeStart) {
                adjustedTargetPosition = seekPosition;
                break;
            }

            if (rangeStart <= seekPosition && rangeEnd >= seekPosition) {
                adjustedTargetPosition = rangeEnd;
                break;
            }
        }

        return adjustedTargetPosition;
    }

    protected _getSegment(segmentNum: number): Segment | null {
        const segResolveInfo = this._state.getSegmentResolveInfo(segmentNum);
        return this._media.getSegment(segResolveInfo);
    }

    protected async _loadSegment(segment: Segment | null) {
        if (!segment) {
            return;
        }

        const msg = `[${this._name}] loadSegment: `
                  + `[${segment.seqNum}] `
                  + `[${segment.startTime.toFixed(3)} - ${segment.endTime.toFixed(3)}] `;

        log.debug(msg);

        this._state.onSegmentLoadStart(segment);

        try {
            // First clear the past buffer to avoid the buffer overflow.
            if (!this._state.seeking) {
                this._buffer?.clearPastBuffer(this._currentTime);
            }

            if (!this._state.initSegmentLoaded) {
                await this._loadInitSegment(segment);
            }

            this._segmentLoader = new SegmentLoader();
            const result = await this._segmentLoader.stream(segment, this._getNewPipeline());
            if (result instanceof Error || result === ABORT_FOR_SEEK) {
                throw result;
            }

            this._state.onSegmentLoadEnd();

            // If this is the last segment of the media,
            // then notify the buffer to flush and close.
            if (this._state.isLastSegment()) {
                this._endOfStream();
            }
        } catch (error) {
            if ((error instanceof Error && error.name === 'AbortError')
                || error === ABORT_FOR_SEEK) {
                // Ignore this error - we are just aborting data
            } else {
                log.error(`[${this._name}] Failed to load segment: ${error}`);
            }
        }

        this._buffer?.printBufferedRanges();
    }

    protected async _loadInitSegment(segment: Segment) {
        await this._initSegmentLoader.load(segment);
        this._state.initSegmentLoaded = true;
    }

    protected _endOfStream() {
        this._buffer?.endOfStream();
        this._state.endOfStream = true;
    }

    protected get _currentTime(): number {
        return this._mediaElement?.currentTime ?? NaN;
    }
}
