import RepBase from './rep-base';
import { DashTypes } from './base';
import type SegmentTemplate from './segment-template';
import type SegmentBase from './segment-base';
import type SegmentList from './segment-list';
import type ISegmentContainer from './segment-container';
import type { ISegmentResolveInfo } from './segment-container';
import { segmentElementClasses } from './segment-container';
import type Segment from './segment';
import * as SegmentResolver from './segment-resolver';
import type { IPeriodInfo } from './data-types';
import BaseURL from './base-url';

const typeMap = {
    qualityRanking: DashTypes.Number,
    bandwidth: DashTypes.Number,
};

/**
 * Representation element
 * @see ISO/IEC 23009-1:2022, 5.3.5
 */
export default class Representation extends RepBase implements ISegmentContainer {
    public readonly id: string;
    public readonly qualityRanking?: number;
    public readonly dependencyId?: string;
    public readonly associationId?: string;
    public readonly associationType?: string;
    public readonly mediaStreamStructureId?: string;
    public readonly bandwidth: number;
    public readonly baseUrls?: BaseURL[];
    public readonly segmentTemplate?: SegmentTemplate;
    public readonly segmentBase?: SegmentBase;
    public readonly segmentList?: SegmentList;

    public initSegment?: Segment;

    private _periodInfo?: IPeriodInfo;

    /**
     * To add: ExtendedBandwidth, SubRepresentation,
     * SegmentBase, SegmentList,
     */

    constructor(json: Record<string, any>, parentBaseUrl?: URL) {
        super(json, typeMap);
        this.id ??= '';
        this.bandwidth ??= 0;

        this.baseUrls = this._createBaseUrls(BaseURL, parentBaseUrl);
        this._createSegmentElements(segmentElementClasses, this.baseUrls);

        this._init();
    }

    public getSegment(segmentResolveInfo: ISegmentResolveInfo): Segment | null {
        return SegmentResolver.getSegment(this, segmentResolveInfo);
    }

    public getSegRange(): [number, number] {
        const rangeStart = this.segmentTemplate?.startNumber ?? this.segmentList?.startNumber ?? NaN;
        const rangeEnd = this.segmentTemplate?.endNumber ?? this.segmentList?.endNumber ?? NaN;
        return [rangeStart, rangeEnd];
    }

    public set periodInfo(info: IPeriodInfo) {
        this._periodInfo = info;
        if (this.segmentTemplate) {
            this.segmentTemplate.periodInfo = info;
        }
        if (this.segmentList) {
            this.segmentList.periodInfo = info;
        }
    }
}
