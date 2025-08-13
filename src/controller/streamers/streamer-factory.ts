import type Media from '../../model/media';
import type NativePlayer from '../native-player';
import type AdaptationSet from '../../model/adaptation-set';
import { StreamType } from '../../model/adaptation-set';
import type Streamer from './streamer';
import VideoStreamer from './video-streamer';
import AudioStreamer from './audio-streamer';
import TextStreamer  from './text-streamer';
import MuxedStreamer from './muxed-streamer';

export function create(streamType: StreamType,
                       media: Media,
                       adaptationSet: AdaptationSet,
                       nativePlayer: NativePlayer,
                       adaptationSetIndex: number): Streamer {
    switch (streamType) {
        case StreamType.VIDEO:
            return new VideoStreamer(streamType, media, adaptationSet, nativePlayer, adaptationSetIndex);
        case StreamType.AUDIO:
            return new AudioStreamer(streamType, media, adaptationSet, nativePlayer, adaptationSetIndex);
        case StreamType.TEXT:
            return new TextStreamer(streamType, media, adaptationSet, nativePlayer, adaptationSetIndex);
        case StreamType.MUXED:
            return new MuxedStreamer(streamType, media, adaptationSet, nativePlayer, adaptationSetIndex);
        default:
            throw new Error(`Unsupported stream type: ${streamType}`);
    }
}
