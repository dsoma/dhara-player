import DharaPlayerController from './controller/controller';

export default class DharaPlayer {
    private readonly _playerContainer: HTMLElement;
    private readonly _controller: DharaPlayerController;

    constructor(playerContainer: HTMLElement) {
        this._playerContainer = playerContainer;
        this._controller = new DharaPlayerController();
    }

    public setSource(sourceUrl: URL) {
        this._controller.setSource(sourceUrl);
    }

    public destroy() {
        this._controller.destroy();
    }
}
