import ModelBase, { DashTypes } from './base';

const typeMap = {
    width: DashTypes.Number,
    height: DashTypes.Number,
    frameRate: DashTypes.Number,
    audioSamplingRate: DashTypes.Number,
    maximumSAPPeriod: DashTypes.Number,
    startWithSAP: DashTypes.Number,
    maxPlayoutRate: DashTypes.Number,
    codingDependency: DashTypes.Boolean,
    selectionPriority: DashTypes.Number,
};

/**
 * Representation base containing the common attributes and elements
 * These attrs and elements could be common to AdaptationSet,
 * Representation and SubRepresentation.
 * @see ISO/IEC 23009-1:2022, 5.3.7
 */
export default class RepBase extends ModelBase {
    public readonly profiles?: string;
    public readonly width?: number;
    public readonly height?: number;
    public readonly sar?: string;
    public readonly frameRate?: number; // handle string with prefix
    public readonly audioSamplingRate?: number; // handle string with commas
    public readonly mimeType?: string;
    public readonly segmentProfiles?: string;
    public readonly codecs?: string;
    public readonly containerProfiles?: string;
    public readonly maximumSAPPeriod?: number;
    public readonly startWithSAP?: number;
    public readonly maxPlayoutRate?: number;
    public readonly codingDependency?: boolean;
    public readonly scanType?: string;
    public readonly selectionPriority?: number;
    public readonly tag?: string;

    /**
     * To add: FramePacking, AudioChannelConfiguration, ContentProtection,
     * OutputProtection, EssentialProperty, SupplementalProperty , InbandEventStream,
     * Switching, RandomAccess, GroupLabel, Label, ProducerReferenceTime,
     * ContentPopularityRate, Resync.
     */

    constructor(json: Record<string, any>, inputTypeMap: Record<string, DashTypes>) {
        super(json, { ...inputTypeMap, ...typeMap });
        this.scanType ??= 'progressive';
        this.selectionPriority ??= 1;
    }
}
