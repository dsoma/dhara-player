import type SegmentBase from './segment-base';
import type SegmentList from './segment-list';
import type SegmentTemplate from './segment-template';
import type Segment from './segment';

export interface ISegmentResolveInfo {
    periodIndex: number;
    adaptationSetIndex: number;
    representationIndex: number;
    segmentNum: number;
    basePath?: URL;
}

export default interface ISegmentContainer {
    basePath?: URL;
    baseUrls?: URL[];
    segmentBase?: SegmentBase;
    segmentList?: SegmentList;
    segmentTemplate?: SegmentTemplate;
    initSegment?: Segment;
    getSegment(segmentResolveInfo: ISegmentResolveInfo): Segment | null;
}
