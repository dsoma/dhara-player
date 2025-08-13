import log from 'loglevel';
import { StreamType } from '../model/adaptation-set';

export default class Buffer {
    public readonly streamType: StreamType;
    private readonly _srcBuffer: SourceBuffer;
    private readonly _mediaSource: MediaSource;
    private _queue: Uint8Array[] = [];
    private _endOfStream: boolean = false;
    private _closed: boolean = false;
    private _aborted: boolean = false;

    constructor(streamType: StreamType, mimeCodec: string, mediaSource: MediaSource) {
        this.streamType = streamType;
        this._mediaSource = mediaSource;
        this._srcBuffer = mediaSource.addSourceBuffer(mimeCodec);
        this._srcBuffer.addEventListener('updateend', () => { this._onUpdateEnd(); });
        this._srcBuffer.addEventListener('error', (event) => { this._onError(event); });
    }

    public destroy() {
        this._queue = [];
        this._srcBuffer.removeEventListener('updateend', () => { this._onUpdateEnd(); });
        this._srcBuffer.removeEventListener('error', (event) => { this._onError(event); });
    }

    public enqueue(chunk: Uint8Array) {
        this._queue.push(chunk);
        this._processQueue();
    }

    public clear() {
        this._queue = [];
    }

    public async abort(): Promise<void> {
        if (this._mediaSource.readyState !== 'open') {
            log.warn('MSE is not open');
            return;
        }

        this.clear();
        this._aborted = true;
        this._srcBuffer.abort();
    }

    public reset() {
        this._aborted = false;
    }

    public getNewSink(): WritableStream {
        this.reset();
        return new BufferSink(this);
    }

    public endOfStream() {
        this._endOfStream = true;
        this._closeIfDone();
    }

    public isClosed(): boolean {
        return this._closed && this._endOfStream;
    }

    public buffered(): TimeRanges {
        return this._srcBuffer.buffered;
    }

    public printBufferedRanges() {
        const buffered = this._srcBuffer.buffered;
        const color = this.streamType === 'video' ? 'blue' : 'green';
        let msg = `%c [Buffer][${this.streamType}] Buffered ranges: `;
        for (let i = 0; i < buffered.length; i++) {
            const start = buffered.start(i);
            const end = buffered.end(i);
            msg += `[${start} - ${end}] `;
        }
        log.debug(msg, `color: ${color}; font-weight: bold`);
    }

    private _processQueue() {
        if (this._srcBuffer.updating || !this._queue.length || this._aborted) {
            return;
        }

        try {
            const chunk = this._queue.shift();
            if (chunk?.length) {
                this._srcBuffer.appendBuffer(chunk);
            }
        } catch (error) {
            log.error(`[Buffer][${this.streamType}] SrcBuffer append failed: `, error);
        }
    }

    private _onUpdateEnd() {
        this._closeIfDone();
        this._processQueue();
    }

    private _onError(event: Event) {
        log.error(`[Buffer][${this.streamType}] SrcBuffer error: `, event);
        this.abort();
    }

    private _closeIfDone() {
        if (this._endOfStream && !this._queue.length) {
            this._closed = true;
        }
    }
}

/**
 * A WritableStream acting as an ultimate sink for the segment data.
 * Pushes the segment data to the associated SourceBuffer.
 */
export class BufferSink extends WritableStream {
    constructor(buffer: Buffer) {
        super(new UnderlyingSink(buffer));
    }
}

/**
 * Underlying sink for the WritableStream.
 * This sink is used by the pipeline to push the segment data.
 */
class UnderlyingSink {
    private readonly _buffer: Buffer;

    constructor(buffer: Buffer) {
        this._buffer = buffer;
    }

    public async write(chunk: Uint8Array, controller: WritableStreamDefaultController) {
        if (chunk.length === 0) return;
        try {
            this._buffer.enqueue(chunk);
        } catch (error) {
            controller.error(error);
        }
    }

    public async close() {
        // Push residual data to the buffer
        // Do cleanup tasks
    }

    public async abort() {
        this._buffer.abort();
    }
}
