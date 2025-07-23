import Mpd from './mpd';
import log from 'loglevel';

export default class Media {
    private _mpd: Mpd | null = null;

    constructor(public srcUrl: URL) {
        //
    }

    public build(metadata: Record<string, any>) {
        this._mpd = new Mpd(metadata);
        log.debug(this._mpd);
    }
}
