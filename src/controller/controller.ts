import { EventEmitter } from 'events';
import Loader from '../services/loader';

enum DPlayerState {
    INITIAL = 'init',
    FETCHING_SRC = 'fetching-src',
    READY = 'ready',
    ERROR = 'error',
}

export default class DharaPlayerController extends EventEmitter {
    private _sourceUrl: URL | null = null;
    private _state: DPlayerState = DPlayerState.INITIAL;
    private readonly _loader: Loader = new Loader();

    public async setSource(sourceUrl: URL) {
        this._sourceUrl = sourceUrl;
        this._state = DPlayerState.FETCHING_SRC;
        const data = await this._loader.load(sourceUrl);
        this._state = data ? DPlayerState.READY : DPlayerState.ERROR;
    }

    public destroy() {
        super.removeAllListeners();
        this._sourceUrl = null;
        this._state = DPlayerState.INITIAL;
    }
}
