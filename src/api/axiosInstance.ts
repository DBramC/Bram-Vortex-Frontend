import axios from 'axios';

const api = axios.create({
    baseURL: '/', // Στο K8S αν το UI & API είναι κάτω από το ίδιο Ingress, το '/' είναι σωστό
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- 1. REQUEST INTERCEPTOR (Ανατομία Αιτήματος) ---
api.interceptors.request.use(
    (config) => {
        const tokenKey = 'jwt_token'; // <--- ΣΙΓΟΥΡΕΨΟΥ ΟΤΙ ΑΥΤΟ ΕΙΝΑΙ ΤΟ ΟΝΟΜΑ
        const token = localStorage.getItem(tokenKey);

        console.log(`[AXIOS-DEBUG] 🛰️ Request to: ${config.url}`);
        console.log(`[AXIOS-DEBUG] 🔑 Looking for key "${tokenKey}" in LocalStorage...`);

        if (token) {
            console.log(`[AXIOS-DEBUG] ✅ Token found! (Starts with: ${token.substring(0, 15)}...)`);

            // Καθαρισμός για αποφυγή Double Bearer
            const rawToken = token.replace('Bearer ', '').trim();
            const finalHeader = `Bearer ${rawToken}`;

            config.headers.Authorization = finalHeader;
            console.log(`[AXIOS-DEBUG] 📤 Final Auth Header: ${finalHeader.substring(0, 25)}...`);
        } else {
            console.warn(`[AXIOS-DEBUG] ❌ NO TOKEN FOUND in LocalStorage!`);
        }

        return config;
    },
    (error) => {
        console.error(`[AXIOS-DEBUG] ❌ Request Error:`, error);
        return Promise.reject(error);
    }
);

// --- 2. RESPONSE INTERCEPTOR (Ανατομία Απάντησης) ---
api.interceptors.response.use(
    (response) => {
        console.log(`[AXIOS-DEBUG] ✅ Response from ${response.config.url}:`, response.status);
        return response;
    },
    (error) => {
        const { response } = error;

        if (response) {
            console.error(`[AXIOS-DEBUG] ⛔ ERROR ${response.status} from ${response.config.url}`);
            console.error(`[AXIOS-DEBUG] 📄 Response Body:`, response.data);

            if (response.status === 401) {
                console.warn("🔒 Unauthorized! Redirecting...");
                localStorage.removeItem('jwt_token');
                window.location.href = '/';
            }
            if (response.status === 403) {
                console.error("🚫 Forbidden! Ο Analyzer απέρριψε το Token. Τσέκαρε το Signature στο Backend.");
            }
        } else {
            console.error(`[AXIOS-DEBUG] 🌐 Network Error (No response from server):`, error.message);
        }

        return Promise.reject(error);
    }
);

export default api;