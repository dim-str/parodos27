export function resolveSockJsUrl() {
    const configuredWs = process.env.NEXT_PUBLIC_WS_URL || '';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

    let url = configuredWs;
    if (!url && apiUrl) {
        url = apiUrl.replace(/\/api\/?$/, '') + '/ws-orders';
    }

    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
        url = url.replace(/^http:\/\//, 'https://');
    }

    return url;
}
