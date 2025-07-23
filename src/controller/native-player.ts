import type { MediaType } from '../model/media';

type MediaElement = HTMLAudioElement | HTMLVideoElement | null;

export default class NativePlayer {
    private _mediaElement: MediaElement = null;

    constructor(private readonly _type: MediaType,
                private readonly _playerContainer: HTMLElement) {
        this._mediaElement = document.createElement(this._type) as MediaElement;
        if (this._mediaElement) {
            this._mediaElement.controls = true;
            this._playerContainer.appendChild(this._mediaElement);
        }
    }

    public destroy() {
        if (this._mediaElement) {
            this._playerContainer.removeChild(this._mediaElement);
            this._mediaElement = null;
        }
    }
}
