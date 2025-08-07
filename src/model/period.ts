import ModelBase, { DashTypes } from './base';
import { Descriptor, type Duration, type IPeriodInfo } from './data-types';
import type SegmentBase from './segment-base';
import type SegmentList from './segment-list';
import type SegmentTemplate from './segment-template';
import AdaptationSet from './adaptation-set';
import type ISegmentContainer from './segment-container';
import type { ISegmentResolveInfo } from './segment-container';
import { segmentElementClasses } from './segment-container';
import type Segment from './segment';
import * as SegmentResolver from './segment-resolver';
import BaseURL from './base-url';

const typeMap = {
    start: DashTypes.Duration,
    duration: DashTypes.Duration,
    bitstreamSwitching: DashTypes.Boolean,
};

/**
 * This class represents the Period element in DASH.
 * @see ISO/IEC 23009-1:2014, 5.3.2 Period element
 */
export default class Period extends ModelBase implements ISegmentContainer {
    public readonly id?: string;
    public start?: Duration;
    public duration?: Duration;
    public readonly bitstreamSwitching?: boolean;
    public readonly baseUrls?: BaseURL[];
    public readonly segmentBase?: SegmentBase;
    public readonly segmentList?: SegmentList;
    public readonly segmentTemplate?: SegmentTemplate;
    public readonly assetIdentifier?: Descriptor;
    public readonly adaptationSets: AdaptationSet[];

    public initSegment?: Segment;
    public endTimeInSeconds?: number;

    /**
     * To add: EventStream, ServiceDescription, ContentProtection, Subset,
     * SupplementalProperty, EmptyAdaptationSet, GroupLabel, Preselection
     */

    constructor(json: Record<string, any>, parentBaseUrl?: URL) {
        super(json, typeMap);

        this.bitstreamSwitching ??= false;
        this.baseUrls = this._createBaseUrls(BaseURL, parentBaseUrl);
        this._createSegmentElements(segmentElementClasses, this.baseUrls);
        this._create(Descriptor, 'AssetIdentifier');

        this.adaptationSets = this._buildArray(AdaptationSet, 'AdaptationSet', this.baseUrls?.[0]?.url);

        this._init();
    }

    public updateTiming() {
        const startTime = this.start?.seconds ?? 0;
        const duration = this.duration?.seconds ?? 0;
        const endTime = this.endTimeInSeconds ?? startTime + duration;
        const periodInfo: IPeriodInfo = {
            startTime,
            duration,
            endTime,
            id: this.id
        };
        this.adaptationSets.forEach(adaptationSet => {
            adaptationSet.periodInfo = periodInfo;
        });
    }

    public getSegment(segmentResolveInfo: ISegmentResolveInfo): Segment | null {
        const { adaptationSetIndex } = segmentResolveInfo;
        if (adaptationSetIndex < 0 || adaptationSetIndex >= this.adaptationSets.length) {
            return null;
        }

        const adaptationSet = this.adaptationSets[adaptationSetIndex];
        let segment = adaptationSet?.getSegment(segmentResolveInfo);
        segment ??= SegmentResolver.getSegment(this, segmentResolveInfo);
        return segment;
    }

    public getSegRange(index: number = 0): [number, number] {
        if (index < 0 || index >= this.adaptationSets.length) {
            return [NaN, NaN];
        }
        const adaptationSet = this.adaptationSets[index];
        const range = adaptationSet?.getSegRange() ?? [NaN, NaN];
        if (Number.isNaN(range[0])) {
            range[0] = this.segmentTemplate?.startNumber ?? this.segmentList?.startNumber ?? NaN;
        }
        if (Number.isNaN(range[1])) {
            range[1] = this.segmentTemplate?.endNumber ?? this.segmentList?.endNumber ?? NaN;
        }
        return range;
    }
}
