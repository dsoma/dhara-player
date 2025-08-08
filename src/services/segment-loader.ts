import type Segment from '../model/segment';
import log from 'loglevel';

export interface ILoaderData {
    headers?: Record<string, string>;
}

export interface IPipeline {
    transformers?: TransformStream[] | null;
    sink?: WritableStream | null;
}

/**
 * Loader to load the segment data and pipe it to the sink.
 */
export default class SegmentLoader {
    protected _data: ILoaderData;

    constructor(data?: ILoaderData) {
        this._data = data ?? {};
    }

    /**
     * Streams the segment data chunks to the sink.
     *
     * Loads the chunks and they are piped through all the transformers in the pipeline.
     * For example: If segment decrypter is a transformer, chunks are decrypted and then piped to the sink.
     *
     * If the sink is not provided, it will return the last readable stream in the pipeline.
     * i.e., the readable stream of the last transformer in the pipeline.
     * This can be used to read the chunks and process further.
     *
     * Make sure that the transformers and the sink are not locked.
     */
    public async stream(segment: Segment, pipeline?: IPipeline, url?: URL): Promise<ReadableStream | null> {
        if (!segment) {
            return null;
        }

        url ??= segment.url;
        pipeline ??= {};

        try {
            const response = await fetch(url.toString(), {
                headers: this._data.headers,
            });

            if (!response.ok) {
                throw new Error(`[SegmentLoader] Status = ${response.status}, Failed to load: ${url}`);
            }

            const source = response.body;
            if (!source) {
                throw new Error(`[SegmentLoader] No readable stream`);
            }

            // Pipe the source through all the transformers in the pipeline.
            let readableStream = source;
            for (const transformer of pipeline.transformers ?? []) {
                readableStream = readableStream.pipeThrough(transformer);
            }

            // If the sink is not provided, return the last readable stream in the pipeline.
            if (!pipeline.sink) {
                return readableStream;
            }

            // If the sink is provided, pipe the transformed data to the ultimate sink.
            await readableStream.pipeTo(pipeline.sink);
            return null;

        } catch (error: unknown) {
            log.error(error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }

    /**
     * Usually, we pipe the readable stream to the sink.
     * Use this method only when we need to directly write the data to the sink.
     */
    protected async _writeToSink(data: Uint8Array, sink: WritableStream): Promise<void> {
        if (!data || !sink) {
            return;
        }

        const writer = sink.getWriter();
        await writer.write(data);
        await writer.ready;
        writer.releaseLock();
    }
}

/**
 * Loader to load the init segment data and cache it.
 */
export class InitSegmentLoader extends SegmentLoader {
    private readonly _cache: Map<string, Uint8Array> = new Map();
    private _pipeline: IPipeline;

    constructor(data?: ILoaderData) {
        super(data);
        this._pipeline = {
            transformers: [],
            sink: null
        };
    }

    public set pipeline(pipeline: IPipeline) {
        this._pipeline = pipeline;
    }

    public destroy(): void {
        this._cache.clear();
    }

    /**
     * If the init segment is already cached, it is written to the sink.
     * If the init segment is not cached, it is loaded.
     * The loaded init segment undergoes all the transformation and then cached.
     * Finally, the transformed data is written to the sink (buffer)
     */
    public async load(segment: Segment,): Promise<void> {
        const initSegmentUrl = segment.initSegmentUrl;
        if (!initSegmentUrl) {
            return;
        }

        const cachedData = this._cache.get(initSegmentUrl.toString());
        if (cachedData && this._pipeline.sink) {
            await this._writeToSink(cachedData, this._pipeline.sink);
            return;
        }

        // Create a new pipeline without the sink.
        // because we will cache the data and then write it to the sink.
        const pipeline = { ...this._pipeline };
        pipeline.sink = null;

        // Load and stream the init segment data through the pipeline.
        // Get the last readable stream and read all the chunks.
        const readableStream = await this.stream(segment, pipeline, initSegmentUrl);
        if (!readableStream) {
            return;
        }

        let data: Uint8Array = new Uint8Array();
        for await (const chunk of readableStream) {
            data = new Uint8Array([...data, ...new Uint8Array(chunk)]);
        }

        // Cache the init segment data.
        this._cache.set(initSegmentUrl.toString(), data);

        // Write the init segment data to the sink.
        if (this._pipeline.sink) {
            await this._writeToSink(data, this._pipeline.sink);
        }
    }
}
