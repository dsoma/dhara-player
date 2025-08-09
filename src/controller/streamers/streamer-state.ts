import AdaptationSet from "../../model/adaptation-set";
import Media from "../../model/media";
import Period from "../../model/period";
import Representation from "../../model/representation";
import Segment from "../../model/segment";
import { ISegmentResolveInfo } from "../../model/segment-container";

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
    private _continuous: boolean = false;

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
        this._continuous = false;
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
        this._continuous = true;
    }

    public onSegmentLoadEnd() {
        this._segmentLoading = false;
        this._continuous = true;
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

    public get nextSegmentNum(): number {
        return this._curSegmentNum + 1;
    }

    public shouldLoadSegment(): boolean {
        return !this._endOfStream && !this._segmentLoading && this._curRep !== null;
    }

    public get continuous(): boolean {
        return this._continuous;
    }

    public set continuous(value: boolean) {
        this._continuous = value;
    }

    public set endOfStream(value: boolean) {
        this._endOfStream = value;
    }

    public getSegmentResolveInfo(segmentNum?: number): ISegmentResolveInfo {
        return {
            periodIndex: this._curPeriodIndex,
            adaptationSetIndex: this._curAdaptationSetIndex,
            representationIndex: this._curRepIndex,
            segmentNum: segmentNum ?? this._curSegmentNum
        };
    }
}
