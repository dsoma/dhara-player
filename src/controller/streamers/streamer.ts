import type Media from '../../model/media';
import type AdaptationSet from '../../model/adaptation-set';
import type Representation from '../../model/representation';
import type Period from '../../model/period';
import type SegmentBase from '../../model/segment-base';
import type NativePlayer from '../native-player';
import Buffer from './buffer';
import log from 'loglevel';

class StreamerState {
    public curRep: Representation | null = null;
    public curPeriod: Period | null = null;
    public curSegment: SegmentBase | null = null;
    public curPeriodIndex: number = 0;
    public curRepIndex: number = 0;
    public curSegmentIndex: number = 0;
}

const PROCESS_TICK = 20; // in milliseconds

/**
 * Streamer is a class that handles the streaming of a media stream.
 * It is responsible for managing the appropriate source buffers for the stream.
 * This is a base class for all streamers.
 */
export default class Streamer {
    protected readonly _media: Media;
    protected readonly _nativePlayer: NativePlayer;
    protected readonly _adaptationSet: AdaptationSet;
    protected _buffer: Buffer | null = null;
    protected _state: StreamerState = new StreamerState();
    protected _timer: NodeJS.Timeout | null = null;
    protected _name: string = this.constructor.name;

    constructor(media: Media, adaptationSet: AdaptationSet, nativePlayer: NativePlayer) {
        this._media = media;
        this._nativePlayer = nativePlayer;
        this._adaptationSet = adaptationSet;
    }

    public initialize(): boolean {
        const mimeType  = this._adaptationSet.getMimeType();
        const codecs    = this._adaptationSet.getCodecs();
        const mimeCodec = `${mimeType}; codecs="${codecs}"`;
        const mediaSource = this._nativePlayer.mediaSource;

        if (!mediaSource) {
            log.warn(`[Streamer] No media source found`);
            return false;
        }

        try {
            this._buffer = new Buffer(mimeCodec, mediaSource);
        } catch (error) {
            log.error(`[Streamer] Failed to create buffer for ${mimeCodec}`);
            log.error(error);
            return false;
        }

        this._state.curPeriod = this._media.periods?.[this._state.curPeriodIndex] ?? null;
        this._state.curRep = this._adaptationSet.representations?.[this._state.curRepIndex] ?? null;

        return true;
    }

    public destroy() {
        this._buffer?.destroy();
        this._buffer = null;
    }

    public onPlay() {
        log.info(`[${this._name}] onPlay`);
        this.start();
    }

    public onPause() {
        log.info(`[${this._name}] onPause`);
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

    protected _process() {
        //
    }
}
