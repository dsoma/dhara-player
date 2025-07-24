import { EventEmitter } from 'events';
import { MediaType } from '../model/media';
import log from 'loglevel';

type MediaElement = HTMLAudioElement | HTMLVideoElement | null;

export enum NativePlayerEvent {
    SOURCE_OPEN  = 'sourceopen',
    SOURCE_CLOSE = 'sourceclose',
    SOURCE_ENDED = 'sourceended',
    ERROR        = 'error',
}

export enum MediaSourceReadyState {
    CLOSED = 'closed',
    OPEN   = 'open',
    ENDED  = 'ended',
}

export default class NativePlayer extends EventEmitter {
    private _mediaElement: MediaElement = null;
    private _mediaSource: MediaSource | null = null;

    constructor(private readonly _type: MediaType,
                private readonly _playerContainer: HTMLElement) {
        super();
        this._createPlayer();
        this._createMediaSource();
    }

    public destroy() {
        if (this._mediaElement) {
            this._playerContainer.removeChild(this._mediaElement);
            this._mediaElement = null;
        }

        if (this._mediaSource) {
            if (this._mediaSource.readyState === 'open') {
                this._mediaSource.endOfStream();
            }

            this._mediaSource.removeEventListener('sourceopen',  this._onSourceOpen.bind(this));
            this._mediaSource.removeEventListener('sourceclose', this._onSourceClose.bind(this));
            this._mediaSource.removeEventListener('sourceended', this._onSourceEnded.bind(this));

            this._mediaSource = null;
        }

        this.removeAllListeners();
    }

    public get readyState(): MediaSourceReadyState {
        return (this._mediaSource?.readyState as MediaSourceReadyState) ?? MediaSourceReadyState.CLOSED;
    }

    private _createPlayer() {
        this._mediaElement = document.createElement(this._type) as MediaElement;
        if (!this._mediaElement) {
            return;
        }

        this._mediaElement.controls = true;
        this._playerContainer.appendChild(this._mediaElement);

        if (this._type === MediaType.VIDEO) {
            const videoElement  = this._mediaElement as HTMLVideoElement;
            videoElement.width  = this._playerContainer.clientWidth;
            videoElement.height = this._playerContainer.clientHeight;
            videoElement.style.width = '100%';
            videoElement.style.height = '100%';
        }
    }

    private _createMediaSource() {
        if (!this._mediaElement || !window.MediaSource) {
            this._onError('MediaSource not supported or media element not available');
            return;
        }

        try {
            this._mediaSource = new MediaSource();
        } catch (error) {
            this._onError('Failed to create MediaSource', error);
            return;
        }

        this._mediaSource.addEventListener('sourceopen',  this._onSourceOpen.bind(this));
        this._mediaSource.addEventListener('sourceclose', this._onSourceClose.bind(this));
        this._mediaSource.addEventListener('sourceended', this._onSourceEnded.bind(this));

        if ('srcObject' in this._mediaElement) {
            try {
                this._mediaElement.srcObject = this._mediaSource;
            } catch (error: unknown) {
                if (error instanceof Error && error.name !== 'TypeError') {
                    this._onError('Failed to set srcObject', error);
                    return;
                }
                this._mediaElement.src = URL.createObjectURL(this._mediaSource);
            }
        } else {
            (this._mediaElement as HTMLAudioElement | HTMLVideoElement).src = URL.createObjectURL(this._mediaSource);
        }
    }

    private _onSourceOpen() {
        this.emit(NativePlayerEvent.SOURCE_OPEN);
    }

    private _onSourceClose() {
        this.emit(NativePlayerEvent.SOURCE_CLOSE);
    }

    private _onSourceEnded() {
        this.emit(NativePlayerEvent.SOURCE_ENDED);
    }

    private _onError(errMsg: string, error: unknown = null) {
        log.error(errMsg, error);
        this.emit(NativePlayerEvent.ERROR, errMsg);
    }
}
