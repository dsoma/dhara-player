import ModelBase, { DashTypes } from './base';
import { Descriptor, type Duration } from './data-types';
import SegmentBase from './segment-base';
import SegmentList from './segment-list';
import SegmentTemplate from './segment-template';
import AdaptationSet from './adaptation-set';

const typeMap = {
    start: DashTypes.Duration,
    duration: DashTypes.Duration,
    bitstreamSwitching: DashTypes.Boolean,
};

/**
 * This class represents the Period element in DASH.
 * @see ISO/IEC 23009-1:2014, 5.3.2 Period element
 */
export default class Period extends ModelBase {
    public readonly id?: string;
    public readonly start?: Duration;
    public readonly duration?: Duration;
    public readonly bitstreamSwitching?: boolean;
    public readonly baseURLs?: URL[];
    public readonly segmentBase?: SegmentBase;
    public readonly segmentList?: SegmentList;
    public readonly segmentTemplate?: SegmentTemplate;
    public readonly assetIdentifier?: Descriptor;
    public readonly adaptationSets?: AdaptationSet[];

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
        this.baseURLs = this._buildArray(URL, 'BaseURL');

        this._init();
    }
}
