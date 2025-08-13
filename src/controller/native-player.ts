import { EventEmitter } from 'events';
import { MediaType } from '../model/media';
import log from 'loglevel';

export type MediaElement = HTMLAudioElement | HTMLVideoElement | null;

export enum NativePlayerEvent {
    ERROR = 'error',
    ENDED = 'ended',
    PAUSE = 'pause',
    PLAY = 'play',
    PLAYING = 'playing',
    SEEKING = 'seeking',
    SEEKED = 'seeked',
    SOURCE_CLOSE = 'sourceclose',
    SOURCE_ENDED = 'sourceended',
    SOURCE_OPEN = 'sourceopen',
    TIMEUPDATE = 'timeupdate',
    VOLUMECHANGE = 'volumechange',
    WAITING = 'waiting',
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

    public get mediaSource(): MediaSource | null {
        return this._mediaSource;
    }

    public get mediaElement(): MediaElement {
        return this._mediaElement;
    }

    public get bufferLength(): number {
        const buffered = this._mediaElement?.buffered ?? null;
        if (!buffered) {
            return 0;
        }
        const currentTime = this._mediaElement?.currentTime ?? 0;
        for (let i = 0; i < buffered.length; i++) {
            if (buffered.start(i) <= currentTime && buffered.end(i) >= currentTime) {
                return buffered.end(i) - currentTime;
            }
        }
        return 0;
    }

    private _createPlayer() {
        this._mediaElement = document.createElement(this._type) as MediaElement;
        if (!this._mediaElement) {
            return;
        }

        this._mediaElement.controls = true;
        this._playerContainer.appendChild(this._mediaElement);

        if (this._type === MediaType.VIDEO) {
            const videoElement = this._mediaElement as HTMLVideoElement;
            videoElement.width = this._playerContainer.clientWidth;
            videoElement.height = this._playerContainer.clientHeight;
            videoElement.style.width = '100%';
            videoElement.style.height = '100%';
            videoElement.style.borderRadius = '0.375rem';
        } else if (this._type === MediaType.AUDIO) {
            const audioElement = this._mediaElement as HTMLAudioElement;
            audioElement.style.width = '100%';
            audioElement.style.borderRadius = '0.375rem';
            this._playerContainer.style.removeProperty('aspect-ratio');
        }

        this._bindEvents();
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

        this._mediaSource.addEventListener('sourceopen', this._onSourceOpen.bind(this));
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

    private _bindEvents() {
        if (!this._mediaElement) {
            return;
        }

        const events = [
            NativePlayerEvent.ERROR,
            NativePlayerEvent.ENDED,
            NativePlayerEvent.PAUSE,
            NativePlayerEvent.PLAY,
            NativePlayerEvent.PLAYING,
            NativePlayerEvent.SEEKING,
            NativePlayerEvent.SEEKED,
            NativePlayerEvent.TIMEUPDATE,
            NativePlayerEvent.VOLUMECHANGE,
            NativePlayerEvent.WAITING,
        ];

        for (const event of events) {
            this._mediaElement.addEventListener(event, (event: Event, ...args: any[]) => {
                this.emit(event.type as NativePlayerEvent, ...args);
            });
        }
    }
}
