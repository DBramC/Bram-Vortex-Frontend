import axios from 'axios';

// 1. Δημιουργία instance που δείχνει στο Kong Gateway (Port 80)
const api = axios.create({
    baseURL: 'http://localhost/',
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. REQUEST INTERCEPTOR (Πριν φύγει το αίτημα)
// Εδώ γίνεται η μαγεία: Παίρνει το token από το storage και το βάζει στο Header
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 3. RESPONSE INTERCEPTOR (Αν γυρίσει απάντηση)
// Αν το backend πει "401 Unauthorized" (έληξε το token), κάνουμε logout
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Session expired. Redirecting to login...");
            localStorage.removeItem('jwt_token');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;