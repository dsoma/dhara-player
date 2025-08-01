const DAYS_PER_WEEK = 7;
const MILLISECONDS_PER_SECOND = 1000;
const EPOCH_START = 0;

const DURATION_PATTERN = /^P(.+)$/;
const TIME_PATTERN     = /T(.+)$/;
const NUMBER_PATTERN   = /(\d+(?:\.\d+)?)/;

/**
 * ISO 8601 duration parser
 * ISO 8601 format: P(n)Y(n)M(n)DT(n)H(n)M(n)S. All components are optional
 * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
 */
export class Duration {
    public readonly milliseconds: number;
    public readonly seconds: number;
    public readonly durationDate: Date;

    constructor(private readonly _rawValue: string, durationDate?: Date) {
        this.durationDate = durationDate ?? this._parse();
        this.milliseconds = this.durationDate.getTime();
        this.seconds = this.milliseconds / MILLISECONDS_PER_SECOND;
    }

    private _parse(): Date {
        // First, validate the basic format starts with P
        const durationMatch = DURATION_PATTERN.exec(this._rawValue);
        if (!durationMatch) {
            throw new Error(`Invalid ISO 8601 duration format: ${this._rawValue}`);
        }

        const durationPart = durationMatch[1];

        // Create a base date (epoch start)
        const durationDate = new Date(EPOCH_START);

        // Parse date components (before T)
        const timeMatch = TIME_PATTERN.exec(durationPart);
        const datePart = timeMatch ? durationPart.substring(0, timeMatch.index) : durationPart;
        const timePart = timeMatch ? timeMatch[1] : '';

        // Parse date components: Y, M, W, D
        const years  = this._extractComponent(datePart, 'Y');
        const months = this._extractComponent(datePart, 'M');
        const weeks  = this._extractComponent(datePart, 'W');
        const days   = this._extractComponent(datePart, 'D');

        // Parse time components: H, M, S
        const hours   = this._extractComponent(timePart, 'H');
        const minutes = this._extractComponent(timePart, 'M');
        const seconds = this._extractComponent(timePart, 'S');

        // Add years
        if (years > 0) {
            durationDate.setFullYear(durationDate.getFullYear() + years);
        }

        // Add months
        if (months > 0) {
            durationDate.setMonth(durationDate.getMonth() + months);
        }

        // Add weeks (7 days each)
        if (weeks > 0) {
            durationDate.setDate(durationDate.getDate() + (weeks * DAYS_PER_WEEK));
        }

        // Add days
        if (days > 0) {
            durationDate.setDate(durationDate.getDate() + days);
        }

        // Add hours
        if (hours > 0) {
            durationDate.setHours(durationDate.getHours() + hours);
        }

        // Add minutes
        if (minutes > 0) {
            durationDate.setMinutes(durationDate.getMinutes() + minutes);
        }

        // Add seconds
        if (seconds > 0) {
            durationDate.setSeconds(durationDate.getSeconds() + seconds);
        }

        return durationDate;
    }

    private _extractComponent(part: string, unit: string): number {
        const pattern = new RegExp(`${NUMBER_PATTERN.source}${unit}`);
        const match = pattern.exec(part);
        return match ? parseFloat(match[1]) : 0;
    }
}

export class Descriptor {
    constructor(public value: string) {
    }
}

export interface IPeriodInfo {
    startTime: number; // in seconds
    duration: number; // in seconds
    endTime: number; // in seconds
    id?: string;
}
