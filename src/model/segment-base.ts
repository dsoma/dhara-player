import ModelBase, { DashTypes } from './base';
import type { Duration } from './data-types';

const typeMap = {
    timescale: DashTypes.Number,
    presentationTimeOffset: DashTypes.Number,
    presentationDuration: DashTypes.Number,
    timeShiftBufferDepth: DashTypes.Duration,
    indexRangeExact: DashTypes.Boolean,
    availabilityTimeOffset: DashTypes.Number,
    availabilityTimeComplete: DashTypes.Boolean,
};

/**
 * SegmentBase element
 * This is the base class for all segment-based elements, such as SegmentTemplate,
 * SegmentList, SegmentTimeline, etc.
 * @see ISO/IEC 23009-1:2022, 5.3.9.2
 */
export default class SegmentBase extends ModelBase {
    public readonly timescale?: number;
    public readonly presentationTimeOffset?: number;
    public readonly presentationDuration?: number;
    public readonly timeShiftBufferDepth?: Duration;
    public readonly indexRange?: string;
    public readonly indexRangeExact?: boolean;
    public readonly availabilityTimeOffset?: number;
    public readonly availabilityTimeComplete?: boolean;
    public readonly initElement?: URL; // Initialization element
    public readonly representationIndex?: URL;

    /**
     * To add: eptDelta, pdDelta, FailoverContent
     */
    constructor(json: Record<string, any>, inputTypeMap: Record<string, DashTypes>) {
        super(json, { ...inputTypeMap, ...typeMap });

        this.indexRangeExact ??= false;
        this.timescale ??= 1;

        this._create(URL, 'Initialization', 'initElement');
        this._create(URL, 'RepresentationIndex');
        this._init();
    }
}
