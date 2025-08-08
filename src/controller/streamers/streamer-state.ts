import AdaptationSet from "../../model/adaptation-set";
import Media from "../../model/media";
import Period from "../../model/period";
import Representation from "../../model/representation";
import Segment from "../../model/segment";
import { ISegmentResolveInfo } from "../../model/segment-container";

export default class StreamerState {
    public readonly curAdaptationSet: AdaptationSet;
    public readonly curAdaptationSetIndex: number;

    public curPeriod: Period | null = null;
    public curRep: Representation | null = null;
    public curSegment: Segment | null = null;

    public curPeriodIndex: number = 0;
    public curRepIndex: number = 0;
    public curSegmentNum: number = 0;

    public segmentLoading: boolean = false;
    public firstSegment: boolean = true;

    constructor(adaptationSet: AdaptationSet, adaptationSetIndex: number) {
        this.curAdaptationSet = adaptationSet;
        this.curAdaptationSetIndex = adaptationSetIndex;
    }

    public initialize(media: Media) {
        this.curPeriodIndex = 0;
        this.curRepIndex = 0;
        this.curPeriod = media.periods?.[0] ?? null;
        this.curRep = this.curAdaptationSet?.representations?.[0] ?? null;
        this.curSegmentNum = this.curAdaptationSet.getSegRange()[0] ?? NaN;
    }

    public get rep(): Representation | null {
        this.curRep = this.curAdaptationSet?.representations?.[this.curRepIndex] ?? null;
        return this.curRep;
    }

    public onSegmentLoadStart(segment: Segment) {
        this.segmentLoading = true;
        this.curSegment = segment;
        this.curSegmentNum = segment.seqNum;
    }

    public onSegmentLoadEnd() {
        this.segmentLoading = false;
        this.firstSegment = false;
    }

    public isLastSegment(periodCount: number): boolean {
        const range = this.curAdaptationSet.getSegRange();
        return this.curSegmentNum === range[1] && this.curPeriodIndex === periodCount - 1;
    }

    public getSegmentResolveInfo(segmentNum?: number): ISegmentResolveInfo {
        return {
            periodIndex: this.curPeriodIndex,
            adaptationSetIndex: this.curAdaptationSetIndex,
            representationIndex: this.curRepIndex,
            segmentNum: segmentNum ?? this.curSegmentNum
        };
    }
}
