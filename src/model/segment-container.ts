import type SegmentBase from './segment-base';
import type SegmentList from './segment-list';
import type SegmentTemplate from './segment-template';
import type Segment from './segment';
import type BaseURL from './base-url';

export interface ISegmentResolveInfo {
    periodIndex: number;
    adaptationSetIndex: number;
    representationIndex: number;
    segmentNum: number;
    basePath?: URL;
}

export default interface ISegmentContainer {
    basePath?: URL;
    baseUrls?: BaseURL[];
    segmentBase?: SegmentBase;
    segmentList?: SegmentList;
    segmentTemplate?: SegmentTemplate;
    initSegment?: Segment;
    getSegment(segmentResolveInfo: ISegmentResolveInfo): Segment | null;
    getSegRange(index?: number): [number, number];
}
