import { ArrayTypes } from './data-types';
import { ATTR_PREFIX } from '../constants';

/**
 * Base class for all Dash model objects.
 *
 * The base provides methods to automatically create members
 * (simple types and the children objects) of the model classes from the JSON input.
 */
export default class ModelBase {
    constructor(json: Record<string, any>,
                types?: Record<string, any>,
                children?: Record<string, any>) {
        if (!json) {
            return;
        }

        for (const [key, value] of Object.entries(json)) {
            if (key.startsWith(ATTR_PREFIX)) {
                this._fromAttrs(key, value, types);
            } else {
                this._fromElements(key, value, children);
            }
        }
    }

    /**
     * The attributes of a Dash element (in xml) turn into members with proper data type.
     */
    protected _fromAttrs(key: string, value: any, types?: Record<string, any>) {
        const attrName = key.slice(ATTR_PREFIX.length);
        (this as any)[attrName] = types?.[attrName] ? new types[attrName](value) : value;
    }

    /**
     * The Dash element (in xml) turns into an instance of the corresponding class.
     */
    protected _fromElements(key: string, value: any, children?: Record<string, any>) {
        const className = key.charAt(0).toLowerCase() + key.slice(1);

        if (ArrayTypes.includes(key)) {
            this._buildArray(`${className}s`, key, value, children);
            return;
        }

        (this as any)[className] = this._buildObject(key, value, children);
    }

    private _buildArray(className: string, key: string,
                        value: any, children?: Record<string, any>) {
        (this as any)[className] = [];
        const arrayMember: any[] = (this as any)[className];

        if (Array.isArray(value)) {
            for (const item of value) {
                arrayMember.push(this._buildObject(key, item, children));
            }
        } else {
            arrayMember.push(this._buildObject(key, value, children));
        }
    }

    private _buildObject(key: string, value: any, children?: Record<string, any>): any {
        return children?.[key] ? new (children as any)[key](value) : value;
    }
}
