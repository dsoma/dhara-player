import SegmentBase from './segment-base';
import SegmentList from './segment-list';
import SegmentTemplate from './segment-template';
import type Segment from './segment';
import type BaseURL from './base-url';
import type { ISegmentElementClasses } from './base';

export enum LookupType {
    SEG_NUM = 0,
    TIME = 1,
}

export interface ISegmentResolveInfo {
    periodIndex: number;
    adaptationSetIndex: number;
    representationIndex: number;
    segmentNum: number;
    targetTime: number;
    lookupType: LookupType;
    basePath?: URL;
}

export default interface ISegmentContainer {
    baseUrls?: BaseURL[];
    segmentBase?: SegmentBase;
    segmentList?: SegmentList;
    segmentTemplate?: SegmentTemplate;
    initSegment?: Segment;
    getSegment(segmentResolveInfo: ISegmentResolveInfo): Segment | null;
    getSegRange(index?: number): [number, number];
}

export const segmentElementClasses: ISegmentElementClasses = {
    segmentBaseClass: SegmentBase,
    segmentListClass: SegmentList,
    segmentTemplateClass: SegmentTemplate,
};
