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

const PROCESS_TICK = 20; // in milliseconds
const MAX_BUFFER_LENGTH = 60; // in seconds

/**
 * Streamer is a class that handles the streaming of a media stream.
 * It is responsible for managing the appropriate source buffers for the stream.
 * This is a base class for all streamers.
 */
export default class Streamer {
    protected readonly _media: Media;
    protected readonly _nativePlayer: NativePlayer;
    protected _adaptationSet: AdaptationSet;
    protected _buffer: Buffer | null = null;
    protected _state: StreamerState;
    protected _timer: NodeJS.Timeout | null = null;
    protected _name: string = this.constructor.name;
    protected _initSegmentLoader: InitSegmentLoader = new InitSegmentLoader();
    protected _initSegmentLoaded: boolean = false;
    protected _curBufferSink: BufferSink | null = null;

    constructor(media: Media, adaptationSet: AdaptationSet,
        nativePlayer: NativePlayer, adaptationSetIndex: number) {
        this._media = media;
        this._nativePlayer = nativePlayer;
        this._adaptationSet = adaptationSet;
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

            this._buffer = new Buffer(mimeCodec, mediaSource);
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
        this.start();
    }

    public onPause() {
        log.debug(`[${this._name}] onPause`);
        this.stop();
    }

    public onEnded() {
        log.debug(`[${this._name}] onEnded`);
        this.stop();
    }

    public onTimeupdate() {
        // const currentTime = this._nativePlayer.mediaElement?.currentTime ?? 0;
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

    protected _process(targetPosition = NaN) {
        const rep = this._determineRepresentation();
        if (!rep) {
            return;
        }

        if (!this._shouldLoadSegment()) {
            return;
        }

        const segmentNum = this._getNextSegmentNum(targetPosition);
        if (Number.isNaN(segmentNum)) {
            return;
        }

        this._loadSegment(this._getSegment(segmentNum));
    }

    protected _determineRepresentation(): Representation | null {
        // At present, hard code the period to 0 and representation index to the last one.
        this._state.repIndex = this._adaptationSet.representations.length - 1;
        return this._state.rep;
    }

    protected _shouldLoadSegment(): boolean {
        if (this._nativePlayer.bufferLength >= MAX_BUFFER_LENGTH) {
            return false;
        }

        return this._state.shouldLoadSegment();
    }

    protected _getNextSegmentNum(targetPosition: number): number {
        const state = this._state;

        // If discontinuous due to position (ex: seek):
        if (!state.continuous && !Number.isNaN(targetPosition)) {
            // Check from the target position.
            // return state.getNextSegmentNum(targetPosition);
            return NaN;
        }

        // If discontinuous, then probably we are at the beginning.
        // Otherwise, just move forward.
        return state.continuous ? state.nextSegmentNum : state.firstSegmentNum;
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
            if (!this._initSegmentLoaded) {
                await this._loadInitSegment(segment);
            }

            await (new SegmentLoader()).stream(segment, this._getNewPipeline());
        } catch (error) {
            log.error(`[${this._name}] Failed to load segment: ${error}`);
        }

        this._state.onSegmentLoadEnd();

        // If this is the last segment of the media, then notify the buffer to flush and close.
        if (this._state.isLastSegment()) {
            this._endOfStream();
        }
    }

    protected async _loadInitSegment(segment: Segment) {
        await this._initSegmentLoader.load(segment);
        this._initSegmentLoaded = true;
    }

    protected _endOfStream() {
        this._buffer?.endOfStream();
        this._state.endOfStream = true;
    }
}
