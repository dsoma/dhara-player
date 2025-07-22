import log from 'loglevel';

export interface LoaderOptions {
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

            const contentType = response.headers.get('content-type');

            if (contentType?.includes('application/dash+xml') || contentType?.includes('text')) {
                data = await response.text();
            } else {
                data = await response.arrayBuffer();
            }
        } catch (error: unknown) {
            log.error(error instanceof Error ? error.message : 'Unknown error');
            return null;
        }

        return data;
    }
}
