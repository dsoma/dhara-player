import type Media from '../../model/media';
import type AdaptationSet from '../../model/adaptation-set';
import type Representation from '../../model/representation';
import type Period from '../../model/period';
import type Segment from '../../model/segment';
import type NativePlayer from '../native-player';
import SegmentLoader, { InitSegmentLoader } from '../../services/segment-loader';
import type { IPipeline } from '../../services/segment-loader';
import Buffer from '../buffer';
import type { BufferSink } from '../buffer';
import log from 'loglevel';
import { ISegmentResolveInfo } from '../../model/segment-container';

class StreamerState {
    public curRep: Representation | null = null;
    public curPeriod: Period | null = null;
    public curSegment: Segment | null = null;
    public curPeriodIndex: number = 0;
    public curAdaptationSetIndex: number = 0;
    public curRepIndex: number = 0;
    public curSegmentNum: number = 0;
    public segmentLoading: boolean = false;
    public firstSegment: boolean = true;
}

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
    protected _state: StreamerState = new StreamerState();
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
        this._state.curAdaptationSetIndex = adaptationSetIndex;
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
            this._buffer = new Buffer(mimeCodec, mediaSource);
            this._initSegmentLoader.pipeline = this._getNewPipeline();
        } catch (error) {
            log.error(`[Streamer] Failed to create buffer for ${mimeCodec}`);
            log.error(error);
            return false;
        }

        this._state.curPeriodIndex = 0;
        this._state.curPeriod = this._media.periods?.[this._state.curPeriodIndex] ?? null;
        this._adaptationSet
            = this._media.getAdaptationSets(this._state.curPeriodIndex)?.[this._state.curAdaptationSetIndex] ?? null;
        this._state.curRep = this._adaptationSet?.representations?.[this._state.curRepIndex] ?? null;
        this._state.curSegmentNum = this._state.curPeriod?.getSegRange(this._getSegmentResolveInfo())?.[0] ?? NaN;

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
        // At present, hard code the period and representation indices to 0.
        const rep = this._getRepresentation();
        if (!rep) {
            return;
        }

        const segmentNum = this._getNextSegmentNum();
        if (isNaN(segmentNum)) {
            return;
        }

        if (this._shouldLoadSegment(segmentNum)) {
            this._loadSegment(this._getSegment(segmentNum));
        }
    }

    protected _getRepresentation(): Representation | null {
        this._state.curRepIndex = 0;
        return this._adaptationSet.representations?.[this._state.curRepIndex] ?? null;
    }

    protected _getNextSegmentNum(): number {
        const state = this._state;
        return state.firstSegment ? state.curSegmentNum : state.curSegmentNum + 1;
    }

    protected _getSegment(segmentNum: number): Segment | null {
        const rep = this._getRepresentation();
        if (!rep) {
            return null;
        }
        return this._media.getSegment(this._getSegmentResolveInfo(segmentNum));
    }

    protected _shouldLoadSegment(segmentNum: number): boolean {
        if (!this._state.curRep) {
            return false;
        }
        if (this._state.segmentLoading) {
            return false;
        }
        if (this._nativePlayer.bufferLength >= MAX_BUFFER_LENGTH) {
            return false;
        }
        const range = this._adaptationSet.getSegRange(this._getSegmentResolveInfo(segmentNum));
        return segmentNum >= range[0] && segmentNum <= range[1];
    }

    protected async _loadSegment(segment: Segment | null) {
        if (!segment) {
            return;
        }

        log.debug(`[${this._name}] loadSegment: [${segment.startTime.toFixed(3)} - ${segment.endTime.toFixed(3)}] ${segment.url}`);

        this._state.segmentLoading = true;
        this._state.curSegmentNum = segment.seqNum;
        this._state.curSegment = segment;

        if (!this._initSegmentLoaded) {
            await this._loadInitSegment(segment);
        }

        await (new SegmentLoader()).stream(segment, this._getNewPipeline());
        this._state.segmentLoading = false;
        this._state.firstSegment = false;
    }

    protected async _loadInitSegment(segment: Segment) {
        await this._initSegmentLoader.load(segment);
        this._initSegmentLoaded = true;
    }

    protected _getSegmentResolveInfo(segmentNum?: number): ISegmentResolveInfo {
        const state = this._state;
        return {
            periodIndex: state.curPeriodIndex,
            adaptationSetIndex: state.curAdaptationSetIndex,
            representationIndex: state.curRepIndex,
            segmentNum: segmentNum ?? state.curSegmentNum
        };
    }
}
