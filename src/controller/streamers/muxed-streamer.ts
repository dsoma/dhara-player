import Streamer from './streamer';

/**
 * MuxedStreamer is a subclass of Streamer that handles the streaming of a muxed stream.
 * A muxed stream contains both audio and video.
 */
export default class MuxedStreamer extends Streamer {
    public destroy() {
        super.destroy();
    }
}
