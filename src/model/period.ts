import ModelBase, { DashTypes } from './base';
import { Descriptor, Duration, type IPeriodInfo } from './data-types';
import SegmentBase from './segment-base';
import SegmentList from './segment-list';
import SegmentTemplate from './segment-template';
import AdaptationSet from './adaptation-set';
import type ISegmentContainer from './segment-container';
import type { ISegmentResolveInfo } from './segment-container';
import type Segment from './segment';
import * as SegmentResolver from './segment-resolver';

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
    public readonly duration?: Duration;
    public readonly bitstreamSwitching?: boolean;
    public readonly baseUrls?: URL[];
    public readonly segmentBase?: SegmentBase;
    public readonly segmentList?: SegmentList;
    public readonly segmentTemplate?: SegmentTemplate;
    public readonly assetIdentifier?: Descriptor;
    public readonly adaptationSets: AdaptationSet[];

    public initSegment?: Segment;

    /**
     * To add: EventStream, ServiceDescription, ContentProtection, Subset,
     * SupplementalProperty, EmptyAdaptationSet, GroupLabel, Preselection
     */

    constructor(json: Record<string, any>) {
        super(json, typeMap);

        this.bitstreamSwitching ??= false;

        this._create(SegmentBase, 'SegmentBase');
        this._create(SegmentList, 'SegmentList');
        this._create(SegmentTemplate, 'SegmentTemplate');
        this._create(Descriptor, 'AssetIdentifier');

        this.adaptationSets = this._buildArray(AdaptationSet, 'AdaptationSet');
        this.baseUrls = this._buildArray(URL, 'BaseURL');

        this._init();
    }

    protected _init() {
        super._init();

        // This should be done in MPD.
        if (!this.start && this.id === '0') {
            this.start = new Duration('PT0S');
        }

        const startTime = this.start?.seconds ?? 0;
        const duration  = this.duration?.seconds ?? 0;
        const endTime   = startTime + duration;

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
        if (!segment) {
            segment = SegmentResolver.getSegment(this, segmentResolveInfo);
        }
        return segment;
    }
}
