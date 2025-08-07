import MultiSegmentBase from './multi-segment-base';

/**
 * SegmentTemplate element
 * @see ISO/IEC 23009-1:2022, 5.3.9.4
 */
export default class SegmentTemplate extends MultiSegmentBase {
    public readonly media?: string;
    public readonly index?: string;
    public readonly initialization?: string;
    public readonly bitstreamSwitching?: string;
    public readonly baseUrl?: URL;

    constructor(json: Record<string, any>, baseUrl?: URL) {
        super(json, {});
        this.baseUrl = baseUrl;
        this._init();
    }
}
