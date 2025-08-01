import Segment from './segment';
import type ISegmentContainer from './segment-container';
import type { ISegmentResolveInfo } from './segment-container';

export function getSegment(segmentContainer: ISegmentContainer,
                           segmentResolveInfo: ISegmentResolveInfo): Segment | null {
    if (!segmentContainer) {
        return null;
    }

    const basePath = getBasePath(segmentContainer, segmentResolveInfo.basePath);
    const segmentNum = segmentResolveInfo.segmentNum;

    if (segmentContainer.segmentTemplate) {
        return fromTemplate(segmentContainer, basePath, segmentNum);
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
                      segmentNum: number): Segment | null {
    const template = segmentContainer.segmentTemplate;
    if (!template) {
        return null;
    }

    const periodInfo = template.periodInfo;

    // Find the position within the segment list:
    const start = template.startNumber ?? 1;
    const end   = template.endNumber ?? start;
    const pos   = segmentNum;
    if (pos < start || pos > end) {
        return null;
    }

    // Find start and end times:
    // If duration is absent, then we must use SegmentTimeline. (fix it later)
    const periodStart = periodInfo?.startTime ?? 0;
    const periodEnd   = periodInfo?.endTime ?? 0;
    let duration  = template.durationSecs ?? 0;
    const startTime = periodStart + (pos - start) * duration;
    let endTime   = startTime + duration;

    if (periodInfo) {
        if (startTime < periodStart || startTime > periodEnd) {
            return null;
        }
        if (endTime > periodEnd) {
            endTime = periodEnd;
            duration = endTime - startTime;
        }
    }

    // Form segment media and init segment urls:
    const url = replaceTokens(template.media, pos, basePath);
    const initSegmentUrl = template.initialization ? new URL(template.initialization, basePath) : new URL('');

    return new Segment({
        url,
        initSegmentUrl,
        seqNum: pos,
        duration,
        startTime,
        endTime,
        timescale: template.timescale
    });
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

function replaceTokens(url: string | undefined, segmentNum: number, basePath: URL): URL {
    if (!url) {
        return new URL('');
    }
    // Other replacement tokens to support:
    // $$ (escape $ sign)
    // $Time$
    // $Number%05d$ (segment number with leading zeros)
    // $RepresentationID$ (representation ID)
    // $Bandwidth$ (bandwidth)
    // $SubNumber$ (only when either $Number$ or $Time$ is present)
    const resolvedUrl = url.replace(/\$Number\$/g, segmentNum.toString());
    return new URL(resolvedUrl, basePath);
}
