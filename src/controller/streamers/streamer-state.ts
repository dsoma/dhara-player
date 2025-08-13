import type AdaptationSet from "../../model/adaptation-set";
import type Media from "../../model/media";
import type Period from "../../model/period";
import type Representation from "../../model/representation";
import type Segment from "../../model/segment";
import type { ISegmentResolveInfo } from "../../model/segment-container";
import { LookupType } from "../../model/segment-container";

export default class StreamerState {
    private readonly _curAdaptationSet: AdaptationSet;
    private readonly _curAdaptationSetIndex: number;

    private _curRep: Representation | null = null;
    private _curSegment: Segment | null = null;

    private _firstPeriod: Period | null = null;
    private _lastPeriod: Period | null = null;

    private _curPeriodIndex: number = 0;
    private _curRepIndex: number = 0;
    private _curSegmentNum: number = NaN;

    private _segmentLoading: boolean = false;
    private _endOfStream: boolean = false;
    private _seeking: boolean = false;

    constructor(adaptationSet: AdaptationSet, adaptationSetIndex: number) {
        this._curAdaptationSet = adaptationSet;
        this._curAdaptationSetIndex = adaptationSetIndex;
    }

    public initialize(media: Media) {
        this._curPeriodIndex = 0;
        this._firstPeriod = media.periods?.[0] ?? null;
        this._lastPeriod  = media.periods?.[media.periods.length - 1] ?? null;

        this.repIndex = 0;
        this._curSegmentNum = NaN;
    }

    public get rep(): Representation | null {
        return this._curRep;
    }

    public set repIndex(repIndex: number) {
        this._curRepIndex = repIndex;
        this._curRep = this._curAdaptationSet?.representations?.[this._curRepIndex] ?? null;
    }

    public onSegmentLoadStart(segment: Segment) {
        this._segmentLoading = true;
        this._curSegment = segment;
        this._curSegmentNum = segment.seqNum;
    }

    public onSegmentLoadEnd() {
        this._segmentLoading = false;
    }

    public onSegmentLoadAborted() {
        this._segmentLoading = false;
    }

    public isFirstSegment(): boolean {
        return this._curSegmentNum === this.firstSegmentNum;
    }

    public isLastSegment(): boolean {
        return this._curSegmentNum === this.lastSegmentNum;
    }

    public get firstSegmentNum(): number {
        const range = this._firstPeriod?.getSegRange(this._curAdaptationSetIndex);
        return range?.[0] ?? NaN;
    }

    public get lastSegmentNum(): number {
        const range = this._lastPeriod?.getSegRange(this._curAdaptationSetIndex) ?? [];
        return range?.[1] ?? NaN;
    }

    public get curSegmentNum(): number {
        return this._curSegmentNum;
    }

    public get nextSegmentNum(): number {
        return this._curSegmentNum + 1;
    }

    public getNextSegmentNumInSequence(): number {
        if (Number.isNaN(this._curSegmentNum)) {
            return this.firstSegmentNum;
        }

        if (this._segmentLoading) {
            return this._curSegmentNum;
        }

        return this.nextSegmentNum;
    }

    public shouldLoadSegment(nextSegmentNum: number): boolean {
        if (this._endOfStream || this._curRep === null) {
            return false;
        }

        if (this._curSegmentNum === nextSegmentNum) {
            return false;
        }

        return !this._segmentLoading;
    }

    public set seeking(value: boolean) {
        this._seeking = value;
    }

    public get seeking(): boolean {
        return this._seeking;
    }

    public set endOfStream(value: boolean) {
        this._endOfStream = value;
    }

    public getSegmentResolveInfo(segmentNum?: number): ISegmentResolveInfo {
        return {
            periodIndex: this._curPeriodIndex,
            adaptationSetIndex: this._curAdaptationSetIndex,
            representationIndex: this._curRepIndex,
            segmentNum: segmentNum ?? this._curSegmentNum,
            targetTime: NaN,
            lookupType: LookupType.SEG_NUM,
        };
    }

    public getSegmentResolveInfoForPosition(position: number): ISegmentResolveInfo {
        return {
            periodIndex: this._curPeriodIndex,
            adaptationSetIndex: this._curAdaptationSetIndex,
            representationIndex: this._curRepIndex,
            segmentNum: NaN,
            targetTime: position,
            lookupType: LookupType.TIME,
        };
    }
}
