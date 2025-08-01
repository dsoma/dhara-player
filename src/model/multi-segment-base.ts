import SegmentBase from './segment-base';
import { DashTypes } from './base';
import type { IPeriodInfo } from './data-types';

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
    public endNumber?: number;
    public durationSecs: number;

    private _periodInfo?: IPeriodInfo;

    /**
     * To add: SegmentTimeline, BitstreamSwitching
     */

    constructor(json: Record<string, any>, inputTypeMap: Record<string, DashTypes>) {
        super(json, { ...inputTypeMap, ...typeMap });
        this.startNumber ??= 1;
        this.durationSecs = (this.duration ?? 0) / (this.timescale ?? 1);
    }

    public set periodInfo(info: IPeriodInfo) {
        this._periodInfo = info;
        // If duration is absent, then we must use SegmentTimeline. (fix it later)
        // If endNumber is explicitly set, do not infer it.
        if (!this.endNumber) {
            const count = Math.ceil(this._periodInfo.duration / this.durationSecs);
            this.endNumber = this.startNumber ? this.startNumber + count - 1 : count;
        }
    }

    public get periodInfo(): IPeriodInfo | undefined {
        return this._periodInfo;
    }
}
