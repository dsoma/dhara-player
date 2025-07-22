export enum ResponseDataType {
    TEXT = 'text',
    ARRAY_BUFFER = 'arraybuffer',
}

export interface LoaderOptions {
    responseDataType?: ResponseDataType;
    headers?: Record<string, string>;
}

type ResponseType = string | ArrayBuffer | null;

export default class Loader {

    public async load(url: URL, options: LoaderOptions = {}): Promise<ResponseType> {
        let data: ResponseType = null;

        try {
            const response = await fetch(url, {
                headers: options.headers,
            });

            if (!response.ok) {
                throw new Error(`Status = ${response.status}, Failed to load: ${url}`);
            }

            if (options.responseDataType === ResponseDataType.ARRAY_BUFFER) {
                data = await response.arrayBuffer();
            } else {
                data = await response.text();
            }

        } catch (error: unknown) {
            console.error(error instanceof Error ? error.message : 'Unknown error');
            return null;
        }

        return data;
    }
}
