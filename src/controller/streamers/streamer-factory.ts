import type Media from '../../model/media';
import type NativePlayer from '../native-player';
import type AdaptationSet from '../../model/adaptation-set';
import { StreamType } from '../../model/adaptation-set';
import type Streamer from './streamer';
import VideoStreamer from './video-streamer';
import AudioStreamer from './audio-streamer';
import TextStreamer  from './text-streamer';
import MuxedStreamer from './muxed-streamer';

export function create(streamType: StreamType, media: Media, adaptationSet: AdaptationSet, nativePlayer: NativePlayer): Streamer {
    switch (streamType) {
        case StreamType.VIDEO:
            return new VideoStreamer(media, adaptationSet, nativePlayer);
        case StreamType.AUDIO:
            return new AudioStreamer(media, adaptationSet, nativePlayer);
        case StreamType.TEXT:
            return new TextStreamer(media, adaptationSet, nativePlayer);
        case StreamType.MUXED:
            return new MuxedStreamer(media, adaptationSet, nativePlayer);
        default:
            throw new Error(`Unsupported stream type: ${streamType}`);
    }
}
