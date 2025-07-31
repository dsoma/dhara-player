import RepBase from './rep-base';
import { DashTypes } from './base';
import SegmentTemplate from './segment-template';

const typeMap = {
    qualityRanking: DashTypes.Number,
    bandwidth: DashTypes.Number,
};

/**
 * Representation element
 * @see ISO/IEC 23009-1:2022, 5.3.5
 */
export default class Representation extends RepBase {
    public readonly id: string;
    public readonly qualityRanking?: number;
    public readonly dependencyId?: string;
    public readonly associationId?: string;
    public readonly associationType?: string;
    public readonly mediaStreamStructureId?: string;
    public readonly bandwidth: number;
    public readonly baseUrls?: URL[];
    public readonly segmentTemplate?: SegmentTemplate;

    /**
     * To add: ExtendedBandwidth, SubRepresentation,
     * SegmentBase, SegmentList,
     */

    constructor(json: Record<string, any>) {
        super(json, typeMap);
        this.id ??= '';
        this.bandwidth ??= 0;

        this.baseUrls = this._buildArray(URL, 'BaseURL');
        this._create(SegmentTemplate, 'SegmentTemplate');

        this._init();
    }
}
