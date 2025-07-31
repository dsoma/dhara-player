export interface ISegmentInfo {
    url: URL;
    initSegmentUrl: URL; // Make it an InitSegment type in future
    duration?: number;
    start?: number;
    end?: number;
    pto?: number;
    timescale?: number;
    seqNum?: number;
    rangeStart?: number;
    rangeEnd?: number;
}

export default class Segment {
    public readonly url: URL;
    public readonly initSegmentUrl?: URL;
    public readonly duration: number;
    public readonly start: number;
    public readonly end: number;
    public readonly pto: number;
    public readonly timescale: number;
    public readonly seqNum: number;
    public readonly rangeStart: number;
    public readonly rangeEnd: number;

    constructor(segInfo: ISegmentInfo) {
        this.url = segInfo?.url ?? new URL('');
        this.initSegmentUrl = segInfo?.initSegmentUrl ?? new URL('');
        this.duration = segInfo?.duration ?? 0;
        this.start = segInfo?.start ?? NaN;
        this.end = segInfo?.end ?? NaN;
        this.pto = segInfo?.pto ?? NaN;
        this.timescale = segInfo?.timescale ?? 1;
        this.seqNum = segInfo?.seqNum ?? NaN;
        this.rangeStart = segInfo?.rangeStart ?? NaN;
        this.rangeEnd = segInfo?.rangeEnd ?? NaN;
    }
}
