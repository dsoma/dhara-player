// import log from 'loglevel';

export default class Buffer {
    private readonly _srcBuffer: SourceBuffer;

    constructor(mimeCodec: string, mediaSource: MediaSource) {
        this._srcBuffer = mediaSource.addSourceBuffer(mimeCodec);
    }

    public destroy() {
        // this._srcBuffer.remove();
    }

    public getNewSink(): WritableStream {
        return new BufferSink(this._srcBuffer);
    }
}

/**
 * A WritableStream acting as an ultimate sink for the segment data.
 * Pushes the segment data to the associated SourceBuffer.
 */
export class BufferSink extends WritableStream {
    constructor(srcBuffer: SourceBuffer) {
        super(new UnderlyingSink(srcBuffer));
    }
}

/**
 * Underlying sink for the WritableStream.
 * This sink is used by the pipeline to push the segment data.
 */
class UnderlyingSink {
    private _srcBuffer: SourceBuffer;

    constructor(srcBuffer: SourceBuffer) {
        this._srcBuffer = srcBuffer;
    }

    public async write(chunk: Uint8Array, controller: WritableStreamDefaultController) {
        if (chunk.length === 0) return;
        try {
            await this._srcBuffer.appendBuffer(chunk);
            // log.debug('Appended chunk. Size = ', chunk.length);
        } catch (error) {
            controller.error(error);
        }
    }

    public async close() {
        // Push residual data to the buffer
        // Do cleanup tasks
        // log.debug('BufferSink close()');
    }

    public async abort() {
        // Handle cancel
    }
}
