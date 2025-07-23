import { XMLParser } from 'fast-xml-parser';
import { ATTR_PREFIX } from '../constants';

export default class MpdParser {
    private _parser: XMLParser | null = null;

    public parse(xml: string): any {
        this._parser ??= new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: ATTR_PREFIX,
        });

        const json = this._parser.parse(xml);
        return json.MPD;
    }
}
