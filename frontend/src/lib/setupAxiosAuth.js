import axios from 'axios';
import { getApiBaseUrl, rewriteBackendUrl } from './apiUrl';

let initialized = false;

export function setupAxiosAuth() {
    if (initialized || typeof window === 'undefined') return;
    initialized = true;

    // Προσθέτουμε by default το withCredentials σε όλα τα axios requests
    // Αυτό λέει στον browser: "Στείλε το HttpOnly cookie αυτόματα!"
    axios.defaults.withCredentials = true;

    axios.interceptors.request.use((config) => {
        // Διατηρούμε τη λογική σου για τα URL rewrites που είναι χρήσιμη
        const originalUrl = typeof config.url === 'string' ? config.url : '';
        const url = rewriteBackendUrl(originalUrl);
        if (url !== originalUrl) {
            config.url = url;
        }

        // ΔΙΑΓΡΑΨΑΜΕ ΟΛΟ ΤΟΝ ΚΩΔΙΚΑ ΠΟΥ ΕΨΑΧΝΕ ΣΕ LOCALSTORAGE ΚΑΙ DOCUMENT.COOKIE
        // Το Header "Authorization: Bearer ..." ΔΕΝ χρειάζεται πλέον!

        return config;
    });

    // Προαιρετικά: Πιάνουμε τα 401 Unauthorized errors αν έληξε το cookie
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.status === 401) {
                // Αν το cookie έληξε, καθαρίζουμε τα στοιχεία και πάμε στο login
                localStorage.removeItem('role');
                localStorage.removeItem('username');
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }
    );
}