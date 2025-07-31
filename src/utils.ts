export function toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
}

export function toTitleCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Get the base path of a URL without the filename
export function getUrlBasePath(url?: URL): string {
    if (!url) {
        return '';
    }
    return url.href.substring(0, url.href.lastIndexOf('/') + 1);
}
