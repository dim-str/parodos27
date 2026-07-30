export function resolveSockJsUrl() {
    const configuredWs = process.env.NEXT_PUBLIC_WS_URL || '';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

    const isBrowser = typeof window !== 'undefined';
    const currentHost = isBrowser ? window.location.hostname : '';
    const runningLocally = currentHost === 'localhost' || currentHost === '127.0.0.1';
    const localhostUrlPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i;

    let url = configuredWs;
    if (!runningLocally && localhostUrlPattern.test(url)) {
        url = '';
    }

    if (!url && apiUrl) {
        url = apiUrl.replace(/\/api\/?$/, '') + '/ws-orders';
    }

    if (isBrowser && window.location.protocol === 'https:' && url.startsWith('http://')) {
        url = url.replace(/^http:\/\//, 'https://');
    }

    return url;
}
