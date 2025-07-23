
export class Duration {
    constructor(public value: string) {
    }
}

/**
 * This is a map of the Dash element names to the corresponding data types.
 */
export const MPD_TYPES: Record<string, Record<string, any>> = {
    MPD: {
        maxSegmentDuration: Duration,
        minBufferTime: Duration,
        minUpdatePeriod: Duration,
        mediaPresentationDuration: Duration,
    },
    Period: {
        start: Duration,
    },
    Representation: {
        //
    },
    SegmentBase: {
        //
    },
    SegmentList: {
        //
    },
    SegmentTemplate: {
        //
    }
};

export const ArrayTypes: string[] = [
    'Period',
    'ProgramInformation',
];
