import type Media from '../../model/media';
import type AdaptationSet from '../../model/adaptation-set';
import type NativePlayer from '../native-player';
import Buffer from './buffer';
import log from 'loglevel';

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

        return true;
    }

    public destroy() {
        this._buffer?.destroy();
        this._buffer = null;
    }
}
