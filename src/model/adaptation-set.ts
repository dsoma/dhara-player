import ModelBase, { DashTypes } from './base';
import SegmentBase from './segment-base';
import SegmentList from './segment-list';
import SegmentTemplate from './segment-template';
import Representation from './representation';

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

/**
 * AdaptationSet element
 * @see ISO/IEC 23009-1:2022, 5.3.3
 */
export default class AdaptationSet extends ModelBase {
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
    public readonly baseURLs?: URL[];
    public readonly segmentBase?: SegmentBase;
    public readonly segmentList?: SegmentList;
    public readonly segmentTemplate?: SegmentTemplate;
    public readonly representations?: Representation[];

    /**
     * To add: par, subsegmentStartsWithSAP, initializationSetRef, initializationPrincipal,
     * Accessibility, Role, Rating, Viewpoint, ContentComponent,
     */
    constructor(json: Record<string, any>) {
        super(json, typeMap);

        this._create(SegmentBase, 'SegmentBase');
        this._create(SegmentList, 'SegmentList');
        this._create(SegmentTemplate, 'SegmentTemplate');

        this.representations = this._buildArray(Representation, 'Representation');
        this.baseURLs = this._buildArray(URL, 'BaseURL');

        this._init();
    }
}
