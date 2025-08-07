import ModelBase from "./base";

export default class BaseURL extends ModelBase {
    public url?: URL;

    /**
     * To add: serviceLocation, byteRange, availabilityTimeOffset
     * availabilityTimeComplete, timeShiftBufferDepth, rangeAccess
     */

    constructor(json: string | Record<string, any>, baseURL?: URL) {
        super(typeof json === 'object' ? json : {});

        if (typeof json === 'string') {
            if (json.startsWith('http')) {
                this.url = new URL(json);
            } else {
                this.url = new URL(json, baseURL?.toString() ?? '');
            }
        }

        this._init();
    }
}
