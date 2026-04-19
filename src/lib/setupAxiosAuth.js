import axios from 'axios';

let initialized = false;

function getTokenFromCookie() {
    if (typeof document === 'undefined') return '';
    const jwtCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('admin_jwt='));
    return jwtCookie ? decodeURIComponent(jwtCookie.split('=')[1]) : '';
}

export function setupAxiosAuth() {
    if (initialized || typeof window === 'undefined') return;
    initialized = true;

    axios.interceptors.request.use((config) => {
        const url = typeof config.url === 'string' ? config.url : '';
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const isBackendRequest = backendUrl && url.startsWith(backendUrl);
        const isAuthRoute = url.startsWith('/api/auth/');

        if (!isBackendRequest || isAuthRoute) return config;

        const token = localStorage.getItem('admin_jwt') || getTokenFromCookie();
        if (token && !config.headers?.Authorization) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    });
}
