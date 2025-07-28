export default class Buffer {
    private readonly _srcBuffer: SourceBuffer;

    constructor(mimeCodec: string, mediaSource: MediaSource) {
        this._srcBuffer = mediaSource.addSourceBuffer(mimeCodec);
    }

    public destroy() {
        // this._srcBuffer.remove();
    }
}
