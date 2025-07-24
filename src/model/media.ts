import Mpd from './mpd';
import log from 'loglevel';
import type AdaptationSet from './adaptation-set';
import type Representation from './representation';
import { StreamType } from './adaptation-set';

export enum MediaType {
    AUDIO = 'audio',
    VIDEO = 'video',
    UNKNOWN = 'unknown',
}

export default class Media {
    public srcUrl?: URL;
    private _mpd: Mpd | null = null;
    private _type: MediaType = MediaType.UNKNOWN;

    public build(metadata: Record<string, any>) {
        this._mpd = new Mpd(metadata);
        log.debug(this._mpd);
    }

    public get type(): MediaType {
        if (this._type !== MediaType.UNKNOWN) {
            return this._type;
        }

        const adaptationSets = this.getAdaptationSets() ?? [];
        let hasAudio = false;

        for (const adaptationSet of adaptationSets) {
            const streamType = adaptationSet.streamType;
            if (streamType === StreamType.AUDIO) {
                hasAudio = true;
                continue;
            }
            if (streamType === StreamType.VIDEO || streamType === StreamType.MUXED) {
                this._type = MediaType.VIDEO;
                return this._type;
            }
        }

        this._type = hasAudio ? MediaType.AUDIO : MediaType.UNKNOWN;
        return this._type;
    }

    public destroy() {
        this._mpd = null;
    }

    public getAdaptationSets(periodIndex: number = 0): AdaptationSet[] {
        return this._mpd?.periods?.[periodIndex]?.adaptationSets ?? [];
    }

    public getRepresentations(periodIndex: number = 0): Representation[] {
        return this._mpd?.periods?.[periodIndex]?.adaptationSets?.[0]?.representations ?? [];
    }
}
