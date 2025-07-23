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
    duration: DashTypes.Number,
};

/**
 * SegmentBase element
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
    public readonly duration?: number;
    public readonly initialization?: URL;
    public readonly representationIndex?: URL;

    /**
     * To add: eptDelta, pdDelta, FailoverContent
     */
    constructor(json: Record<string, any>) {
        super(json, typeMap);

        this.indexRangeExact ??= false;

        this._create(URL, 'Initialization');
        this._create(URL, 'RepresentationIndex');
        this._init();
    }
}
