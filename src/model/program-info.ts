import ModelBase from './base';

/**
 * Descriptive information about the program
 * @see ISO/IEC 23009-1:2022, 5.7:
 */
export default class ProgramInformation extends ModelBase {
    public readonly lang?: string;
    public readonly moreInformationURL?: URL;
    public readonly title?: string;
    public readonly source?: string;
    public readonly language?: string;
    public readonly copyright?: string;
}
