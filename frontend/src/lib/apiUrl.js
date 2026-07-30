const LOCALHOST_PATTERN = /^(localhost|127\.0\.0\.1)$/i;

function stripTrailingSlash(value) {
    return value.endsWith('/') ? value.slice(0, -1) : value;
}

function isLocalHost(hostname) {
    return LOCALHOST_PATTERN.test(hostname || '');
}

function safeParseUrl(value) {
    try {
        return new URL(value);
    } catch {
        return null;
    }
}

export function getApiBaseUrl() {
    const configured = (process.env.NEXT_PUBLIC_API_URL || '').trim();
    const isBrowser = typeof window !== 'undefined';

    if (!isBrowser) return stripTrailingSlash(configured);

    if (!configured) {
        return `${window.location.origin}/api`;
    }

    const parsedConfigured = safeParseUrl(configured);
    if (!parsedConfigured) return stripTrailingSlash(configured);

    const appOnLocalHost = isLocalHost(window.location.hostname);
    const apiOnLocalHost = isLocalHost(parsedConfigured.hostname);

    if (!appOnLocalHost && apiOnLocalHost) {
        const apiPath = parsedConfigured.pathname && parsedConfigured.pathname !== '/'
            ? stripTrailingSlash(parsedConfigured.pathname)
            : '/api';
        return `${window.location.origin}${apiPath}`;
    }

    if (
        window.location.protocol === 'https:' &&
        parsedConfigured.protocol === 'http:' &&
        parsedConfigured.hostname === window.location.hostname
    ) {
        parsedConfigured.protocol = 'https:';
        return stripTrailingSlash(parsedConfigured.toString());
    }

    return stripTrailingSlash(configured);
}

export function resolveApiUrl(path = '') {
    const base = getApiBaseUrl();
    if (!path) return base;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
}

export function rewriteBackendUrl(url) {
    if (typeof url !== 'string' || !url) return url;

    const configured = stripTrailingSlash((process.env.NEXT_PUBLIC_API_URL || '').trim());
    const resolved = getApiBaseUrl();

    if (!configured || !resolved || configured === resolved) {
        return url;
    }

    return url.startsWith(configured) ? `${resolved}${url.slice(configured.length)}` : url;
}
