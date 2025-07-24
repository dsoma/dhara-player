import type Media from '../../model/media';
import type NativePlayer from '../native-player';

/**
 * Streamer is a class that handles the streaming of a media stream.
 * It is responsible for managing the appropriate source buffers for the stream.
 * This is a base class for all streamers.
 */
export default class Streamer {
    protected readonly _media: Media;
    protected readonly _nativePlayer: NativePlayer;

    constructor(media: Media, nativePlayer: NativePlayer) {
        this._media = media;
        this._nativePlayer = nativePlayer;
    }

    public destroy() {
        //
    }
}
