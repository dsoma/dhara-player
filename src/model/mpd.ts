import ModelBase, { DashTypes } from './base';
import BaseURL from './base-url';
import { Duration } from './data-types';
import Period from './period';
import ProgramInformation from './program-info';
import type Segment from './segment';
import type { ISegmentResolveInfo } from './segment-container';

const typeMap = {
    availabilityStartTime: DashTypes.Date,
    publishTime: DashTypes.Date,
    availabilityEndTime: DashTypes.Date,
    mediaPresentationDuration: DashTypes.Duration,
    minimumUpdatePeriod: DashTypes.Duration,
    minBufferTime: DashTypes.Duration,
    timeShiftBufferDepth: DashTypes.Duration,
    suggestedPresentationDelay: DashTypes.Duration,
    maxSegmentDuration: DashTypes.Duration,
    maxSubsegmentDuration: DashTypes.Duration,
};

export enum PresentationType {
    VOD = 'static',
    LIVE = 'dynamic',
}

/**
 * This class represents the MPD element in DASH.
 * @see ISO/IEC 23009-1:2022, 5.3.1 MPD element
 */
export default class Mpd extends ModelBase {
    public readonly id?: string;
    public readonly profiles: string;
    public readonly type: PresentationType;
    public readonly availabilityStartTime?: Date;
    public readonly publishTime?: Date;
    public readonly availabilityEndTime?: Date;
    public readonly mediaPresentationDuration?: Duration;
    public readonly minimumUpdatePeriod?: Duration;
    public readonly minBufferTime: Duration;
    public readonly timeShiftBufferDepth?: Duration;
    public readonly suggestedPresentationDelay?: Duration;
    public readonly maxSegmentDuration?: Duration;
    public readonly maxSubsegmentDuration?: Duration;
    public readonly programInformations?: ProgramInformation[];
    public readonly baseUrls?: BaseURL[];
    public readonly locations?: string[];
    public readonly periods: Period[];

    /**
     * To add:
     * PatchLocation, ServiceDescription, InitializationSet, InitializationGroup,
     * InitializationPresentation, ContentProtection, Metrics,
     * EssentialProperty, SupplementalProperty, UTCTiming, LeapSecondInformation
     */

    constructor(json: Record<string, any>, parentBaseUrl?: URL) {
        super(json, typeMap);

        this.baseUrls = this._createBaseUrls(BaseURL, parentBaseUrl);
        this._create(ProgramInformation, 'ProgramInformation');
        this.periods = this._buildArray(Period, 'Period', this.baseUrls?.[0]?.url);

        this.profiles ??= '';
        this.type ??= PresentationType.VOD;
        this.minBufferTime ??= new Duration('');

        this._init();
    }

    public getSegment(segmentResolveInfo: ISegmentResolveInfo): Segment | null {
        const { periodIndex } = segmentResolveInfo;
        if (periodIndex < 0 || periodIndex >= this.periods.length) {
            return null;
        }

        const period = this.periods[periodIndex];
        return period?.getSegment(segmentResolveInfo) ?? null;
    }

    protected _init() {
        super._init();
        this._computePeriodTiming();
    }

    private _computePeriodTiming() {
        if (!this.periods.length) {
            return;
        }

        if (this.type === PresentationType.VOD) {
            // If period start is absent, and MPD is VOD, then set the first period start to zero.
            this.periods[0].start ??= new Duration('PT0S');
            // If there is only one period, set the duration to the media presentation duration.
            if (this.periods.length === 1) {
                this.periods[0].duration = this.mediaPresentationDuration;
            }
        }

        let elapsedTime = 0;

        for (const period of this.periods) {
            period.start ??= new Duration('', new Date(elapsedTime * 1000));
            elapsedTime += period.duration?.seconds ?? 0;
            period.endTimeInSeconds = elapsedTime;
            period.updateTiming();
        }
    }
}
