import log from 'loglevel';
import { StreamType } from '../model/adaptation-set';

const PAST_BUFFER_LENGTH = 30;
const REMOVE_BUFFER_THRESHOLD = 2;

type Range = {
    start: number;
    end: number;
}

export default class Buffer {
    public readonly streamType: StreamType;
    private readonly _srcBuffer: SourceBuffer;
    private readonly _mediaSource: MediaSource;
    private _queue: Uint8Array[] = [];
    private _removeQueue: Range[] = [];
    private _endOfStream: boolean = false;
    private _closed: boolean = false;

    constructor(streamType: StreamType, mimeCodec: string, mediaSource: MediaSource) {
        this.streamType = streamType;
        this._mediaSource = mediaSource;
        this._srcBuffer = mediaSource.addSourceBuffer(mimeCodec);
        this._srcBuffer.addEventListener('updateend', () => { this._onUpdateEnd(); });
        this._srcBuffer.addEventListener('error', (event) => { this._onError(event); });
    }

    public destroy() {
        this._queue = [];
        this._removeQueue = [];
        this._srcBuffer.removeEventListener('updateend', () => { this._onUpdateEnd(); });
        this._srcBuffer.removeEventListener('error', (event) => { this._onError(event); });
    }

    public enqueue(chunk: Uint8Array) {
        this._queue.push(chunk);
        this._processQueue();
    }

    public clear() {
        this._queue = [];
        this._removeQueue = [];
    }

    public abort() {
        if (this._mediaSource.readyState !== 'open') {
            log.warn('MSE is not open');
            return;
        }

        log.debug(`[Buffer][${this.streamType}] Aborting buffer`);
        this.clear();
        this._srcBuffer.abort();
    }

    public getNewSink(): WritableStream {
        return new BufferSink(this);
    }

    public endOfStream() {
        this._endOfStream = true;
        this._closeIfDone();
    }

    public open() {
        this._endOfStream = false;
        this._closed = false;
    }

    public isClosed(): boolean {
        return this._closed && this._endOfStream;
    }

    public buffered(): TimeRanges {
        return this._srcBuffer.buffered;
    }

    public getBufferedLength(currentPosition: number): number {
        const buffered = this._srcBuffer.buffered;
        for (let i = 0; i < buffered.length; i++) {
            const start = buffered.start(i);
            const end = buffered.end(i);
            if (currentPosition >= start && currentPosition <= end) {
                return end - currentPosition;
            }
        }
        return 0;
    }

    public clearPastBuffer(currentPosition: number) {
        const pastBufferedLength = this._getPastBufferedLength(currentPosition);
        if (pastBufferedLength <= 0 || pastBufferedLength <= PAST_BUFFER_LENGTH) {
            return;
        }

        const removalAmount = pastBufferedLength - PAST_BUFFER_LENGTH;
        if (removalAmount <= REMOVE_BUFFER_THRESHOLD) {
            return;
        }

        const rangeStart = this._srcBuffer.buffered.length > 0 ? this._srcBuffer.buffered.start(0) : 0;
        const rangeEnd   = Math.max(rangeStart, rangeStart + removalAmount);
        if (rangeEnd > rangeStart) {
            this._removeQueue.push({ start: rangeStart, end: rangeEnd });
            this._processQueue();
        }
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
        if (this._srcBuffer.updating) {
            return;
        }

        // Remove buffer if there is something in the queue.
        if (this._removeQueue.length) {
            const range = this._removeQueue.shift();
            if (range) {
                this._srcBuffer.remove(range.start, range.end);
            }
        }

        // Append buffer if there is something in the queue.
        if (!this._queue.length) {
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

    private _getPastBufferedLength(currentPosition: number): number {
        const buffered = this._srcBuffer.buffered;
        let pastBufferedLength = 0;
        for (let i = 0; i < buffered.length; i++) {
            const start = buffered.start(i);
            const end = buffered.end(i);
            if (end < currentPosition) {
                pastBufferedLength += end - start;
            } else if (start < currentPosition && end >= currentPosition) {
                pastBufferedLength += currentPosition - start;
                break;
            }
        }
        return pastBufferedLength;
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
