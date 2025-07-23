import ModelBase, { DashTypes } from './base';

const typeMap = {
    qualityRanking: DashTypes.Number,
    bandwidth: DashTypes.Number,
};

/**
 * Representation element
 * @see ISO/IEC 23009-1:2022, 5.3.5
 */
export default class Representation extends ModelBase {
    public readonly id: string;
    public readonly qualityRanking?: number;
    public readonly dependencyId?: string;
    public readonly associationId?: string;
    public readonly associationType?: string;
    public readonly mediaStreamStructureId?: string;
    public readonly bandwidth: number;

    /**
     * To add: BaseURL, ExtendedBandwidth, SubRepresentation,
     * SegmentBase, SegmentList, SegmentTemplate,
     */

    constructor(json: Record<string, any>) {
        super(json, typeMap);
        this.id ??= '';
        this.bandwidth ??= 0;
        this._init();
    }
}
