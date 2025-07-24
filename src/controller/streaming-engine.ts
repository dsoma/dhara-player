import { EventEmitter } from 'events';
import type Media from '../model/media';
import type NativePlayer from './native-player';
import { MediaSourceReadyState, NativePlayerEvent } from './native-player';
import type Streamer from './streamers/streamer';
import * as StreamerFactory from './streamers/streamer-factory';
import { StreamType } from '../model/adaptation-set';

export enum StreamingEngineEvent {
    ERROR = 'error',
}

export default class StreamingEngine extends EventEmitter {
    private readonly _media: Media;
    private readonly _nativePlayer: NativePlayer;
    private _streamers: Streamer[] = [];

    constructor(media: Media, nativePlayer: NativePlayer) {
        super();
        this._media = media;
        this._nativePlayer = nativePlayer;

        if (this._nativePlayer.readyState === MediaSourceReadyState.OPEN) {
            this._initialize();
        } else {
            this._nativePlayer.on(NativePlayerEvent.SOURCE_OPEN, this._initialize.bind(this));
        }
    }

    public destroy() {
        this.removeAllListeners();
        for (const streamer of this._streamers) {
            streamer.destroy();
        }
        this._streamers = [];
    }

    private _initialize() {
        for (const adaptationSet of this._media.getAdaptationSets()) {
            const streamType = adaptationSet.streamType;
            if (streamType === StreamType.UNKNOWN) {
                continue;
            }

            this._streamers.push( StreamerFactory.create(streamType, this._media, this._nativePlayer) );
        }
    }
}
