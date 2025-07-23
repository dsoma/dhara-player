import ModelBase from './base';
import { Duration, MPD_TYPES } from './data-types';
import Period from './period';
import ProgramInformation from './program-info';

const children = {
    Period,
    ProgramInformation
};

/**
 * This class represents the MPD element in DASH.
 * @see ISO/IEC 23009-1:2022, 5.3.1 MPD element
 */
export default class Mpd extends ModelBase {
    public readonly id?: string;
    public readonly profiles: string;
    public readonly type: string;
    public readonly availabilityStartTime?: Date;
    public readonly publishTime?: Date;
    public readonly availabilityEndTime?: Date;
    public readonly mediaPresentationDuration?: Duration;
    public readonly timeShiftBufferDepth?: Duration;
    public readonly suggestedPresentationDelay?: Duration;
    public readonly minimumUpdatePeriod?: Duration;
    public readonly dynamic?: boolean;
    public readonly location?: string;
    public readonly minBufferTime: Duration;
    public readonly maxSegmentDuration?: Duration;
    public readonly programInformation?: ProgramInformation;
    public readonly periods: Period[];

    constructor(json: Record<string, any>) {
        super(json, MPD_TYPES.MPD, children);
        this.profiles ??= '';
        this.type ??= 'static';
        this.minBufferTime ??= new Duration('');
        this.periods ??= [];
    }
}
