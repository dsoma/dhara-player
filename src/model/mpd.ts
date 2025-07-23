import ModelBase from './base';
import { Duration, InitializationSet, MPD_TYPES } from './data-types';
import Period from './period';
import ProgramInformation from './program-info';

const children = {
    Period,
    ProgramInformation
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
    public readonly initializationSets?: InitializationSet[];
    public readonly periods: Period[];

    /**
     * To add:
     * PatchLocation, ServiceDescription, InitializationGroup,
     * InitializationPresentation, ContentProtection, Metrics,
     * EssentialProperty, SupplementalProperty, UTCTiming, LeapSecondInformation
     */

    constructor(json: Record<string, any>) {
        super(json, MPD_TYPES.MPD, children);
        this.profiles ??= '';
        this.type ??= PresentationType.VOD;
        this.minBufferTime ??= new Duration('');
        this.periods ??= [];
    }
}
