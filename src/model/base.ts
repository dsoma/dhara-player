import { Duration, Descriptor } from './data-types';
import { ATTR_PREFIX } from '../constants';
import { toCamelCase } from '../utils';

export enum DashTypes {
    Duration = 0,
    URL,
    Descriptor,
    Date,
    Number,
    Boolean,
}

/**
 * Base class for all Dash model objects.
 *
 * The base provides methods to automatically create members
 * (simple types and the children objects) of the model classes from the JSON input.
 */
export default class ModelBase {
    constructor(protected json: Record<string, any>, types?: Record<string, any>) {
        if (!json) {
            return;
        }

        for (const [key, value] of Object.entries(json)) {
            if (key.startsWith(ATTR_PREFIX)) {
                this._fromAttrs(key, value, types);
            }
        }
    }

    /**
     * The attributes of a Dash element (in xml) turn into members with proper data type.
     */
    protected _fromAttrs(key: string, value: any, types?: Record<string, DashTypes>) {
        const attrName = key.slice(ATTR_PREFIX.length);
        const self = this as any;

        if (!types) {
            self[attrName] = value;
            return;
        }

        switch (types[attrName]) {
            case DashTypes.Duration: self[attrName] = new Duration(value); break;
            case DashTypes.URL: self[attrName] = new URL(value); break;
            case DashTypes.Descriptor: self[attrName] = new Descriptor(value); break;
            case DashTypes.Date: self[attrName] = new Date(value); break;
            case DashTypes.Number: self[attrName] = Number(value); break;
            case DashTypes.Boolean: self[attrName] = Boolean(value); break;
            default: self[attrName] = value;
        }
    }

    /**
     * Build an array of objects from the JSON input.
     */
    protected _buildArray(classDef: any, elementName: string): any[] {
        const arrayMember: any[] = [];
        const className = elementName ?? classDef.name;

        if (!this.json?.[className]) {
            return arrayMember;
        }

        const value = this.json[className];

        if (!Array.isArray(value)) {
            arrayMember.push(new classDef(value));
            return arrayMember;
        }

        for (const item of value) {
            arrayMember.push(new classDef(item));
        }

        return arrayMember;
    }

    protected _create(classDef: any, elementName: string, property?: string) {
        const className = elementName ?? classDef.name;

        if (!this.json?.[className]) {
            return;
        }

        const memberName = property ?? toCamelCase(className);
        (this as any)[memberName] = new classDef(this.json[className]);
    }

    protected _init() {
        delete (this as any).json;
    }
}
