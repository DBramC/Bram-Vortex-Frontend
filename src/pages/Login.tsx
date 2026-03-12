import React from 'react';

// Η πύλη Kong ακούει στο port 80 του localhost
const KONG_GATEWAY_URL = 'http://localhost';
const GITHUB_AUTH_ENDPOINT = '/oauth2/authorization/github';

const Login: React.FC = () => {

    const handleLogin = () => {
        const redirectUrl = `${KONG_GATEWAY_URL}${GITHUB_AUTH_ENDPOINT}`;
        console.log(`Εκκίνηση OAuth2 Flow. Redirecting to: ${redirectUrl}`);
        window.location.href = redirectUrl;
    };

    return (
        // 1. Background με τη νέα κλάση του θέματος (bg-bram-bg αντί για #1a1a1a)
        <div className="flex items-center justify-center min-h-screen bg-bram-bg p-4 font-sans">

            {/* 2. Card με bg-bram-surface και border-bram-border (αντί για #2d2d2d / #404040) */}
            <div className="p-10 shadow-xl rounded-2xl w-full max-w-sm text-center bg-bram-surface border border-bram-border relative overflow-hidden">

                {/* Προαιρετικό: Διακριτική πράσινη λάμψη πίσω από το κείμενο για πιο μοντέρνο ύφος */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-green-400/10 blur-[50px] rounded-full pointer-events-none"></div>

                <div className="relative z-10">
                    {/* 3. Σκούρος, καθαρός τίτλος (text-bram-text-main) */}
                    <h2 className="text-3xl font-extrabold mb-8 text-bram-text-main tracking-tight flex items-center justify-center gap-2">
                        <span>🌪️</span> Bram Vortex
                    </h2>

                    {/* Κουμπί Login (bg-bram-primary αντί για indigo) */}
                    <button
                        onClick={handleLogin}
                        className="w-full flex items-center justify-center px-4 py-3.5 border border-transparent text-lg font-semibold rounded-xl shadow-md text-white bg-bram-primary hover:bg-bram-primary-hover focus:outline-none focus:ring-4 focus:ring-green-500/30 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
                    >
                        <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.418 2.865 8.163 6.845 9.475.5.092.682-.213.682-.475 0-.237-.01-.866-.015-1.7-2.782.605-3.374-1.34-3.374-1.34-.454-1.15-.99-1.455-.99-1.455-.81-.555.06-.543.06-.543.896.063 1.368.93 1.368.93.795 1.363 2.088.97 2.592.74.08-.578.31-1.076.565-1.32-1.986-.225-4.06-1.0-4.06-4.43 0-.97.347-1.758.917-2.375-.092-.225-.398-1.127.087-2.348 0 0 .75-.237 2.455.91A8.48 8.48 0 0110 3.997c.805.006 1.61.107 2.378.318 1.705-1.147 2.455-.91 2.455-.91.485 1.22.18 2.123.088 2.348.57.617.917 1.405.917 2.375 0 3.438-2.078 4.2-4.068 4.42.32.276.606.83.606 1.674 0 1.21-.01 2.183-.01 2.484 0 .265.18.57.688.47C17.14 18.17 20 14.425 20 10.017A10.015 10.015 0 0010 0z" clipRule="evenodd" />
                        </svg>
                        Είσοδος μέσω GitHub
                    </button>

                    {/* 4. Γκρι κείμενο (text-bram-text-muted αντί για #9ca3af) */}
                    <p className="mt-6 text-sm font-medium text-bram-text-muted">
                        Χρησιμοποιήστε τον λογαριασμό σας στο GitHub για ασφαλή σύνδεση.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;