import Segment from './segment';
import type ISegmentContainer from './segment-container';
import type { ISegmentResolveInfo } from './segment-container';
import Representation from './representation';
import AdaptationSet from './adaptation-set';

export function getSegment(segmentContainer: ISegmentContainer,
                           segmentResolveInfo: ISegmentResolveInfo): Segment | null {
    if (!segmentContainer) {
        return null;
    }

    const basePath = getBasePath(segmentContainer, segmentResolveInfo.basePath);
    const segmentNum = segmentResolveInfo.segmentNum;

    if (segmentContainer.segmentTemplate) {
        return fromTemplate(segmentContainer, segmentResolveInfo, basePath, segmentNum);
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
                      segmentResolveInfo: ISegmentResolveInfo,
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
    const tokenMap = {
        Number: segmentNum,
        RepresentationID: getRepId(segmentContainer, segmentResolveInfo),
        Bandwidth: getBandwidth(segmentContainer, segmentResolveInfo),
        Time: startTime,
        basePath
    };
    const url = replaceTokens(template.media, tokenMap);
    const initSegmentUrl = template.initialization
                         ? replaceTokens(template.initialization, tokenMap)
                         : new URL('');

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
        return segmentContainer.baseUrls[0].url ?? new URL('');
    }
    return basePath ?? new URL('');
}

function getRepId(segmentContainer: ISegmentContainer,
                  segmentResolveInfo: ISegmentResolveInfo): string {
    if (segmentContainer instanceof Representation) {
        return segmentContainer.id;
    }
    if (segmentContainer instanceof AdaptationSet) {
        return segmentContainer.representations?.[segmentResolveInfo.representationIndex]?.id ?? '';
    }
    return '';
}

function getBandwidth(segmentContainer: ISegmentContainer,
                      segmentResolveInfo: ISegmentResolveInfo): number {
    if (segmentContainer instanceof Representation) {
        return segmentContainer.bandwidth;
    }
    if (segmentContainer instanceof AdaptationSet) {
        return segmentContainer.representations?.[segmentResolveInfo.representationIndex]?.bandwidth ?? 0;
    }
    return 0;
}

function replaceTokens(url: string | undefined,
                       tokenMap: Record<string, string | number | URL>): URL {
    if (!url) {
        return new URL('');
    }

    // Other replacement tokens to support:
    // $SubNumber$ (only when either $Number$ or $Time$ is present)

    let resolvedUrl = url.replace(/\$\$/g, '$');

    // Handle $Number%05d$ format (segment number with leading zeros)
    resolvedUrl = resolvedUrl.replace(/\$Number%(\d+)d\$/g, (_, width) => {
        const segmentNum = tokenMap.Number;
        return segmentNum.toString().padStart(parseInt(width, 10), '0');
    });

    // Handle $Bandwidth%05d$ format (bandwidth with leading zeros)
    resolvedUrl = resolvedUrl.replace(/\$Bandwidth%(\d+)d\$/g, (_, width) => {
        const bandwidth = tokenMap.Bandwidth;
        return bandwidth.toString().padStart(parseInt(width, 10), '0');
    });

    // Handle $Time%05d$ format (time with leading zeros)
    resolvedUrl = resolvedUrl.replace(/\$Time%(\d+)d\$/g, (_, width) => {
        const time = tokenMap.Time;
        return time.toString().padStart(parseInt(width, 10), '0');
    });

    resolvedUrl = resolvedUrl.replace(/\$Number\$/g, tokenMap.Number as string);
    resolvedUrl = resolvedUrl.replace(/\$RepresentationID\$/g, tokenMap.RepresentationID as string);
    resolvedUrl = resolvedUrl.replace(/\$Bandwidth\$/g, tokenMap.Bandwidth as string);
    resolvedUrl = resolvedUrl.replace(/\$Time\$/g, tokenMap.Time as string);
    return new URL(resolvedUrl, tokenMap.basePath as URL);
}
