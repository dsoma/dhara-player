import { DashTypes } from './base';
import RepBase from './rep-base';
import type SegmentBase from './segment-base';
import type SegmentList from './segment-list';
import type SegmentTemplate from './segment-template';
import Representation from './representation';
import type ISegmentContainer from './segment-container';
import type { ISegmentResolveInfo } from './segment-container';
import { segmentElementClasses } from './segment-container';
import type Segment from './segment';
import * as SegmentResolver from './segment-resolver';
import type { IPeriodInfo } from './data-types';
import BaseURL from './base-url';

const typeMap = {
    id: DashTypes.Number,
    group: DashTypes.Number,
    minBandwidth: DashTypes.Number,
    maxBandwidth: DashTypes.Number,
    minWidth: DashTypes.Number,
    maxWidth: DashTypes.Number,
    minHeight: DashTypes.Number,
    maxHeight: DashTypes.Number,
    minFrameRate: DashTypes.Number,
    maxFrameRate: DashTypes.Number,
    segmentAlignment: DashTypes.Boolean,
    subsegmentAlignment: DashTypes.Boolean,
    bitstreamSwitching: DashTypes.Boolean,
};

export enum StreamType {
    UNKNOWN = 'unknown',
    AUDIO = 'audio',
    VIDEO = 'video',
    TEXT = 'text',
    MUXED = 'muxed', // contains both audio and video
}

/**
 * AdaptationSet element
 * @see ISO/IEC 23009-1:2022, 5.3.3
 */
export default class AdaptationSet extends RepBase implements ISegmentContainer {
    public readonly id?: number;
    public readonly group?: number;
    public readonly lang?: string;
    public readonly contentType?: string;
    public readonly minBandwidth?: number;
    public readonly maxBandwidth?: number;
    public readonly minWidth?: number;
    public readonly maxWidth?: number;
    public readonly minHeight?: number;
    public readonly maxHeight?: number;
    public readonly minFrameRate?: number;
    public readonly maxFrameRate?: number;
    public readonly segmentAlignment?: boolean;
    public readonly subsegmentAlignment?: boolean;
    public readonly bitstreamSwitching?: boolean;
    public readonly baseUrls?: BaseURL[];
    public readonly segmentBase?: SegmentBase;
    public readonly segmentList?: SegmentList;
    public readonly segmentTemplate?: SegmentTemplate;
    public readonly representations: Representation[];

    public initSegment?: Segment;

    private readonly _firstRepresentation?: Representation | null;
    private _periodInfo?: IPeriodInfo;

    /**
     * To add: par, subsegmentStartsWithSAP, initializationSetRef, initializationPrincipal,
     * Accessibility, Role, Rating, Viewpoint, ContentComponent,
     */
    constructor(json: Record<string, any>, parentBaseUrl?: URL) {
        super(json, typeMap);

        this.baseUrls = this._createBaseUrls(BaseURL, parentBaseUrl);
        this._createSegmentElements(segmentElementClasses, this.baseUrls);

        this.representations = this._buildArray(Representation, 'Representation', this.baseUrls?.[0]?.url?.toString() ?? '');
        this._firstRepresentation = this.representations[0] ?? null;

        this._init();
    }

    public set periodInfo(info: IPeriodInfo) {
        this._periodInfo = info;
        this.representations.forEach(representation => {
            representation.periodInfo = info;
        });
        if (this.segmentTemplate) {
            this.segmentTemplate.periodInfo = info;
        }
        if (this.segmentList) {
            this.segmentList.periodInfo = info;
        }
    }

    public get streamType(): StreamType {
        const contentType = this.contentType?.toLowerCase();
        const mimeType = this.getMimeType();

        if (contentType?.startsWith('video') || mimeType?.startsWith('video')) {
            // The video stream could be muxed. Figure this out later.
            return StreamType.VIDEO;
        }

        if (contentType?.startsWith('audio') || mimeType?.startsWith('audio')) {
            return StreamType.AUDIO;
        }

        if (contentType?.startsWith('text') || mimeType?.startsWith('text')) {
            return StreamType.TEXT;
        }

        return StreamType.UNKNOWN;
    }

    public getMimeType(): string {
        return this.mimeType?.toLowerCase() ?? this._firstRepresentation?.mimeType?.toLowerCase() ?? '';
    }

    public getCodecs(): string {
        return this.codecs ?? this._firstRepresentation?.codecs ?? '';
    }

    public getSegment(segmentResolveInfo: ISegmentResolveInfo): Segment | null {
        const { representationIndex } = segmentResolveInfo;
        if (representationIndex < 0 || representationIndex >= this.representations.length) {
            return null;
        }

        const representation = this.representations[representationIndex];
        let segment = representation?.getSegment(segmentResolveInfo);
        segment ??= SegmentResolver.getSegment(this, segmentResolveInfo);
        return segment;
    }

    public getSegRange(): [number, number] {
        const representation = this.representations[0];
        const range = representation?.getSegRange() ?? [NaN, NaN];
        if (Number.isNaN(range[0])) {
            range[0] = this.segmentTemplate?.startNumber ?? this.segmentList?.startNumber ?? NaN;
        }
        if (Number.isNaN(range[1])) {
            range[1] = this.segmentTemplate?.endNumber ?? this.segmentList?.endNumber ?? NaN;
        }
        return range;
    }
}
