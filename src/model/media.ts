import Mpd from './mpd';
import log from 'loglevel';
import type AdaptationSet from './adaptation-set';
import type Representation from './representation';
import { StreamType } from './adaptation-set';
import type Period from './period';
import { getUrlBasePath } from '../utils';
import type Segment from './segment';
import type { ISegmentResolveInfo } from './segment-container';

export enum MediaType {
    AUDIO = 'audio',
    VIDEO = 'video',
    UNKNOWN = 'unknown',
}

export default class Media {
    public srcUrl?: URL;
    public srcBasePath?: URL;

    private _mpd: Mpd | null = null;
    private _type: MediaType = MediaType.UNKNOWN;

    public build(metadata: Record<string, any>) {
        this.srcBasePath = new URL(getUrlBasePath(this.srcUrl));
        this._mpd = new Mpd(metadata, this.srcBasePath);
        log.debug(this);
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

    public get periods(): Period[] {
        return this._mpd?.periods ?? [];
    }

    public getAdaptationSets(periodIndex: number = 0): AdaptationSet[] {
        return this._mpd?.periods?.[periodIndex]?.adaptationSets ?? [];
    }

    public getRepresentations(periodIndex: number = 0, adaptationSetIndex: number = 0): Representation[] {
        return this.getAdaptationSets(periodIndex)?.[adaptationSetIndex]?.representations ?? [];
    }

    public getSegment(segmentResolveInfo: ISegmentResolveInfo): Segment | null {
        const { periodIndex } = segmentResolveInfo;
        if (!this._mpd || periodIndex < 0 || periodIndex >= this.periods.length) {
            return null;
        }
        return this._mpd?.getSegment(segmentResolveInfo) ?? null;
    }

    public getSegmentForPosition(position: number, resolveInfo: ISegmentResolveInfo): Segment | null {
        const periods = this.periods;
        if (!periods.length) {
            return null;
        }

        const periodIndex = this.getPeriodIndexForPosition(position);
        if (periodIndex < 0) {
            return null;
        }

        resolveInfo.periodIndex = periodIndex;
        return this.getSegment(resolveInfo);
    }

    public getPeriodIndexForPosition(position: number): number {
        const periods = this.periods;
        if (!periods.length) {
            return -1;
        }

        for (let i = 0; i < periods.length; i++) {
            const period = periods[i];
            const periodStart = period.start?.seconds ?? 0;
            const periodEnd   = period.endTimeInSeconds ?? 0;
            if (position >= periodStart && position < periodEnd) {
                return i;
            }
        }

        return -1;
    }
}
