import ModelBase, { DashTypes } from './base';
import { Duration } from './data-types';
import Period from './period';
import ProgramInformation from './program-info';

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
    public readonly baseURLs?: URL[];
    public readonly locations?: string[];
    public readonly periods: Period[];

    /**
     * To add:
     * PatchLocation, ServiceDescription, InitializationSet, InitializationGroup,
     * InitializationPresentation, ContentProtection, Metrics,
     * EssentialProperty, SupplementalProperty, UTCTiming, LeapSecondInformation
     */

    constructor(json: Record<string, any>) {
        super(json, typeMap);

        this._create(ProgramInformation);
        this.periods  = this._buildArray(Period);
        this.baseURLs = this._buildArray(URL, 'BaseURL');

        this.profiles ??= '';
        this.type ??= PresentationType.VOD;
        this.minBufferTime ??= new Duration('');

        this._init();
    }
}
