import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL
});

apiClient.interceptors.request.use((config) => {
    if (typeof window === 'undefined') return config;
    const token = localStorage.getItem('admin_jwt');
    if (token && !config.headers?.Authorization) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default apiClient;
