import { EventEmitter } from 'events';
import type Media from '../model/media';
import type NativePlayer from './native-player';
import { MediaSourceReadyState, NativePlayerEvent } from './native-player';
import type Streamer from './streamers/streamer';
import * as StreamerFactory from './streamers/streamer-factory';
import { StreamType } from '../model/adaptation-set';
import { toTitleCase } from '../utils';

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
        this._unbindNativePlayerEvents();
    }

    private _initialize() {
        for (const adaptationSet of this._media.getAdaptationSets()) {
            const streamType = adaptationSet.streamType;
            if (streamType === StreamType.UNKNOWN) {
                continue;
            }

            const streamer = StreamerFactory.create(streamType, this._media, adaptationSet, this._nativePlayer);
            if (streamer.initialize()) {
                this._streamers.push(streamer);
            }
        }

        this._bindNativePlayerEvents();
    }

    private _bindNativePlayerEvents() {
        for (const event of Object.values(NativePlayerEvent)) {
            this._nativePlayer.on(event, this._onNativePlayerEvent.bind(this, event));
        }
    }

    private _unbindNativePlayerEvents() {
        for (const event of Object.values(NativePlayerEvent)) {
            this._nativePlayer.off(event, this._onNativePlayerEvent.bind(this, event));
        }
    }

    private _onNativePlayerEvent(event: NativePlayerEvent, ...args: any[]) {
        try {
            const handlerName = `on${toTitleCase(event)}`;
            const methodName  = `_${handlerName}`;
            if ((this as any)[methodName]) {
                (this as any)[methodName](...args);
            } else {
                this._sendEventToStreamers(handlerName, ...args);
            }
        } catch { /* ignore */ }
    }

    private _sendEventToStreamers(methodName: string, ...args: any[]) {
        for (const streamer of this._streamers) {
            try {
                (streamer as any)[methodName](...args);
            } catch { /* ignore */ }
        }
    }
}
