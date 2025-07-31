import SegmentBase from './segment-base';
import { DashTypes } from './base';

const typeMap = {
    duration: DashTypes.Number,
    startNumber: DashTypes.Number,
    endNumber: DashTypes.Number,
};

/**
 * This is the base class for all multi-segment-based elements,
 * such as SegmentTemplate, SegmentList etc.
 * @see ISO/IEC 23009-1:2022, 5.3.9.2
 */
export default class MultiSegmentBase extends SegmentBase {
    public readonly duration?: number;
    public readonly startNumber?: number;
    public readonly endNumber?: number;

    /**
     * To add: SegmentTimeline, BitstreamSwitching
     */

    constructor(json: Record<string, any>, inputTypeMap: Record<string, DashTypes>) {
        super(json, { ...inputTypeMap, ...typeMap });
        this.startNumber ??= 1; // fix it later
        this.endNumber ??= this.startNumber; // fix it later
    }
}
