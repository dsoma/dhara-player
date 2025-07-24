import { MediaType } from '../model/media';
import log from 'loglevel';

type MediaElement = HTMLAudioElement | HTMLVideoElement | null;

export default class NativePlayer {
    private _mediaElement: MediaElement = null;
    private _mediaSource: MediaSource | null = null;

    constructor(private readonly _type: MediaType,
                private readonly _playerContainer: HTMLElement) {
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
            this._mediaSource = null;
        }
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
            log.error('MediaSource not supported or media element not available');
            return;
        }

        try {
            this._mediaSource = new MediaSource();
            this._mediaElement.src = URL.createObjectURL(this._mediaSource);
        } catch (error) {
            log.error('Failed to create MediaSource', error);
            return;
        }
    }
}
