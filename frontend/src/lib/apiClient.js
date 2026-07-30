import axios from 'axios';
import { getApiBaseUrl } from './apiUrl';

const apiClient = axios.create({
    baseURL: getApiBaseUrl(),
    withCredentials: true
});

apiClient.interceptors.request.use((config) => {
    if (typeof window === 'undefined') return config;
    
    // Ψάχνουμε όλα τα πιθανά κλειδιά που μπορεί να έχεις χρησιμοποιήσει
    const token = localStorage.getItem('token') || localStorage.getItem('admin_jwt');
    
    if (token && token !== 'undefined' && token !== 'null') {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default apiClient;
