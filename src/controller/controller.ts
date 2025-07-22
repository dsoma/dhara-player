import { EventEmitter } from 'events';
import Loader from '../services/loader';

enum DPlayerState {
    INITIAL = 'Init',
    FETCHING_SRC = 'FetchingSrc',
    PREPARING = 'Preparing',
    READY = 'Ready',
    ERROR = 'Error',
}

export default class DharaPlayerController extends EventEmitter {
    private _state: DPlayerState = DPlayerState.INITIAL;
    private readonly _loader: Loader = new Loader();

    public async setSource(sourceUrl: URL) {
        console.log(`[Controller] MPD URL = ${sourceUrl}`);
        this.setState(DPlayerState.FETCHING_SRC, { sourceUrl });
    }

    public destroy() {
        super.removeAllListeners();
        this._state = DPlayerState.INITIAL;
    }

    private async setState(state: DPlayerState, data?: any) {
        if (this._state === state) {
            return;
        }

        this._state = state;
        console.log(`[Controller] State = ${state}`);
        this[`_on${state}`](data);
    }

    private _onInit() {
        //
    }

    private async _onFetchingSrc(data?: any): Promise<void> {
        const sourceUrl = data?.sourceUrl;
        if (!sourceUrl) {
            this.error = 'Invalid src url';
            return;
        }

        const metadata = await this._loader.load(sourceUrl);
        if (!metadata) {
            this.error = 'Failed to load metadata';
            return;
        }

        this.setState(DPlayerState.PREPARING, { metadata });
    }

    private _onPreparing() {
        // Send the loaded metadata to the mpd parser
    }

    private _onReady() {
        // Create video element and setup MSE
    }

    private _onError() {
        // Send the error to the error handler
    }

    private set error(errMsg: string) {
        this.setState(DPlayerState.ERROR, { error: new Error(errMsg) });
    }
}
