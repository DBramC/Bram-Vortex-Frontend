import axios from 'axios';

const api = axios.create({
    // Χρησιμοποιούμε το '/' αν τρέχεις το frontend και το backend στο ίδιο domain/proxy
    // ή βάλε ολόκληρο το URL (π.χ. http://localhost:8080/api)
    baseURL: '/',
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- 1. REQUEST INTERCEPTOR ---
// Εδώ διορθώνουμε το πρόβλημα με το "Double Bearer"
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwt_token');

        if (token) {
            /**
             * ΕΛΕΓΧΟΣ:
             * Αν το token ξεκινάει ήδη με "Bearer " (επειδή το πήραμε έτσι από το URL),
             * το περνάμε ως έχει. Αν όχι, του το προσθέτουμε εμείς.
             */
            const headerValue = token.startsWith('Bearer ')
                ? token
                : `Bearer ${token}`;

            config.headers.Authorization = headerValue;

            // Debugging (προαιρετικό): Εκτύπωση για να βλέπεις τι φεύγει στο request
            // console.log("Final Auth Header sent to API:", headerValue);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// --- 2. RESPONSE INTERCEPTOR ---
// Διαχείριση σφαλμάτων από το Backend
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Αν ο server επιστρέψει 401 (Unauthorized), το session έληξε
        if (error.response && error.response.status === 401) {
            console.warn("🔒 Session expired. Redirecting to login...");
            localStorage.removeItem('jwt_token');
            window.location.href = '/';
        }

        // Αν επιστρέψει 403, ίσως υπάρχει πρόβλημα με τα roles ή το token format
        if (error.response && error.response.status === 403) {
            console.error("⛔ Access Forbidden: Check token format or user permissions.");
        }

        return Promise.reject(error);
    }
);

export default api;