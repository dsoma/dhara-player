import DharaPlayerController from './controller/controller';

export default class DharaPlayer {
    private readonly _controller: DharaPlayerController;

    constructor(playerContainer: HTMLElement) {
        this._controller = new DharaPlayerController(playerContainer);
    }

    public setSource(sourceUrl: URL) {
        this._controller.setSource(sourceUrl);
    }

    public element(): HTMLMediaElement | null {
        return this._controller.element();
    }

    public destroy() {
        this._controller.destroy();
    }
}
