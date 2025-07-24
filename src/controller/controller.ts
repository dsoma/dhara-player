import { EventEmitter } from 'events';
import Loader from '../services/loader';
import log from 'loglevel';
import MpdParser from '../services/mpd-parser';
import Media from '../model/media';
import NativePlayer, { NativePlayerEvent } from './native-player';
import StreamingEngine, { StreamingEngineEvent } from './streaming-engine';

log.setLevel('debug');

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
    private readonly _media: Media = new Media();
    private _nativePlayer: NativePlayer | null = null;
    private _streamingEngine: StreamingEngine | null = null;

    constructor(private readonly _playerContainer: HTMLElement) {
        super();
    }

    public async setSource(sourceUrl: URL) {
        log.info(`[Controller] MPD URL = ${sourceUrl}`);
        this._media.srcUrl = sourceUrl;
        this.setState(DPlayerState.FETCHING_SRC, { sourceUrl });
    }

    public destroy() {
        super.removeAllListeners();
        this._state = DPlayerState.INITIAL;
        this._nativePlayer?.destroy();
        this._nativePlayer?.removeAllListeners();
        this._nativePlayer = null;
        this._media.destroy();
        this._streamingEngine?.destroy();
        this._streamingEngine = null;
    }

    private async setState(state: DPlayerState, data?: any) {
        if (this._state === state) {
            return;
        }

        this._state = state;
        log.info(`[Controller] State = ${state}`);
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

    private async _onPreparing(data?: any) {
        if (!data?.metadata) {
            return;
        }

        this._media.build(new MpdParser().parse(data.metadata));

        this._nativePlayer = new NativePlayer(this._media.type, this._playerContainer);
        this._nativePlayer.on(NativePlayerEvent.SOURCE_OPEN, () => { this.setState(DPlayerState.READY); });
        this._nativePlayer.on(NativePlayerEvent.ERROR, (errMsg: string) => { this.error = errMsg; });
    }

    private _onReady() {
        if (!this._nativePlayer) {
            return;
        }

        this._streamingEngine = new StreamingEngine(this._media, this._nativePlayer);
        this._streamingEngine.on(StreamingEngineEvent.ERROR, (errMsg: string) => { this.error = errMsg; });
    }

    private async _onError(data?: any) {
        // Send the error to the error handler
        log.error(data?.error);
    }

    private set error(errMsg: string) {
        this.setState(DPlayerState.ERROR, { error: new Error(errMsg) });
    }
}
