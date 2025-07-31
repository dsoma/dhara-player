import Segment from './segment';
import type ISegmentContainer from './segment-container';
import type { ISegmentResolveInfo } from './segment-container';

export function getSegment(segmentContainer: ISegmentContainer,
                           segmentResolveInfo: ISegmentResolveInfo): Segment | null {
    if (!segmentContainer) {
        return null;
    }

    const basePath = getBasePath(segmentContainer, segmentResolveInfo.basePath);
    const segmentIndex = segmentResolveInfo.segmentIndex;

    if (segmentContainer.segmentTemplate) {
        return fromTemplate(segmentContainer, basePath, segmentIndex);
    }

    if (segmentContainer.segmentList) {
        return fromList();
    }

    if (segmentContainer.segmentBase) {
        return fromBase();
    }

    return null;
}

function fromTemplate(segmentContainer: ISegmentContainer,
                      basePath: URL,
                      segmentIndex: number): Segment | null {
    const template = segmentContainer.segmentTemplate;
    if (!template) {
        return null;
    }

    const start = template.startNumber ?? 1;
    const end   = template.endNumber ?? start;
    if (segmentIndex < start || segmentIndex > end) {
        return null;
    }

    const url = resolveUrl(template.media, segmentIndex, basePath);
    const initSegmentUrl = template.initialization ? new URL(template.initialization, basePath) : new URL('');

    const segment = new Segment({
        url,
        initSegmentUrl,
        seqNum: segmentIndex,
        duration: template.duration,
        timescale: template.timescale
    });

    return segment;
}

function fromList(): Segment | null {
    return null; // implement it later
}

function fromBase(): Segment | null {
    return null; // implement it later
}

function getBasePath(segmentContainer: ISegmentContainer, basePath?: URL): URL {
    if (segmentContainer.baseUrls?.length) {
        return segmentContainer.baseUrls[0];
    }
    return basePath ?? new URL('');
}

function resolveUrl(url: string | undefined, segmentIndex: number, basePath: URL): URL {
    if (!url) {
        return new URL('');
    }
    const resolvedUrl = url.replace(/\$Number\$/g, segmentIndex.toString());
    return new URL(resolvedUrl, basePath);
}
