import ModelBase from './base';
import { MPD_TYPES } from './data-types';

/**
 * This class represents the Period element in DASH.
 * @see ISO/IEC 23009-1:2014, 5.3.2 Period element
 */
export default class Period extends ModelBase {
    constructor(json: Record<string, any>) {
        super(json, MPD_TYPES.Period, {});
    }
}
