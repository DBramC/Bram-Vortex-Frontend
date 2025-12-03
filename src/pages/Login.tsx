import React from 'react';

// Η πύλη Kong ακούει στο port 80 του localhost
const KONG_GATEWAY_URL = 'http://localhost';
// Αυτό είναι το default endpoint του Spring Security για εκκίνηση του OAuth2 flow
const GITHUB_AUTH_ENDPOINT = '/oauth2/authorization/github';

const Login: React.FC = () => {

    const handleLogin = () => {
        // --- ΔΙΟΡΘΩΣΗ: Προσθέτουμε το πρωτόκολλο 'http://' και το σωστό endpoint ---
        const redirectUrl = `${KONG_GATEWAY_URL}${GITHUB_AUTH_ENDPOINT}`;

        console.log(`Εκκίνηση OAuth2 Flow. Redirecting to: ${redirectUrl}`);

        // Ο Browser πλέον καταλαβαίνει ότι πρέπει να κάνει HTTP αίτημα
        window.location.href = redirectUrl;
    };

    return (
        // 1. Εξασφαλίζουμε πλήρες ύψος οθόνης (min-h-screen)
        // 2. Χρησιμοποιούμε flexbox για κεντράρισμα (justify-center, items-center)
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            {/* Κάρτα Login: Padding, λευκό φόντο, σκιές, στρογγυλεμένες γωνίες και κεντράρισμα κειμένου */}
            <div className="p-8 bg-white shadow-xl rounded-lg w-full max-w-sm text-center">
                <h2 className="text-2xl font-extrabold mb-8 text-gray-900">
                    🌪️ Bram Vortex - Σύνδεση
                </h2>
                <button
                    onClick={handleLogin}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-lg font-medium rounded-xl shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300 ease-in-out transform hover:scale-[1.01]"
                >
                    <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.418 2.865 8.163 6.845 9.475.5.092.682-.213.682-.475 0-.237-.01-.866-.015-1.7-2.782.605-3.374-1.34-3.374-1.34-.454-1.15-.99-1.455-.99-1.455-.81-.555.06-.543.06-.543.896.063 1.368.93 1.368.93.795 1.363 2.088.97 2.592.74.08-.578.31-1.076.565-1.32-1.986-.225-4.06-1.0-4.06-4.43 0-.97.347-1.758.917-2.375-.092-.225-.398-1.127.087-2.348 0 0 .75-.237 2.455.91A8.48 8.48 0 0110 3.997c.805.006 1.61.107 2.378.318 1.705-1.147 2.455-.91 2.455-.91.485 1.22.18 2.123.088 2.348.57.617.917 1.405.917 2.375 0 3.438-2.078 4.2-4.068 4.42.32.276.606.83.606 1.674 0 1.21-.01 2.183-.01 2.484 0 .265.18.57.688.47C17.14 18.17 20 14.425 20 10.017A10.015 10.015 0 0010 0z" clipRule="evenodd" />
                    </svg>
                    Είσοδος μέσω GitHub
                </button>
                <p className="mt-6 text-sm text-gray-600">
                    Χρησιμοποιήστε τον λογαριασμό σας στο GitHub για ασφαλή σύνδεση.
                </p>
            </div>
        </div>
    );
};

export default Login;