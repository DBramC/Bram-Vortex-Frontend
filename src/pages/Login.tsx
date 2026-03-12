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
        /* 1. Background: Restful White/Pale Blue (bg-bram-bg) */
        <div className="flex items-center justify-center min-h-screen bg-bram-bg p-6 font-sans antialiased">

            /* 2. Card: Καθαρό λευκό, έντονο border και βαθιά σκιά χωρίς cropping */
            <div className="p-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] w-full max-w-md text-center bg-white border-2 border-bram-border relative">

                /* 3. Meaningful Blue Glow: Μπλε λάμψη για tech αίσθηση */
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-bram-accent/10 blur-[60px] rounded-full pointer-events-none"></div>

                <div className="relative z-10">
                    /* 4. Branding: Ενοποιημένο με το Dashboard. Το Vortex είναι Μπλε. */
                    <h1 className="text-5xl font-black text-bram-text-main tracking-tighter mb-2">
                        Bram <span className="text-bram-accent">Vortex</span>
                    </h1>
                    <p className="text-lg font-bold text-bram-text-muted mb-10 tracking-tight">
                        Cloud Infrastructure Intelligence
                    </p>

                    /* 5. Action Button: Πράσινο (Primary) για την ενέργεια */
                    <button
                        onClick={handleLogin}
                        className="w-full flex items-center justify-center px-6 py-4.5 border-none text-xl font-black rounded-2xl shadow-xl shadow-green-200 text-white bg-bram-primary hover:bg-bram-primary-hover hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-green-500/30 transition-all duration-300 ease-in-out transform active:scale-95"
                    >
                        <svg className="w-7 h-7 mr-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.418 2.865 8.163 6.845 9.475.5.092.682-.213.682-.475 0-.237-.01-.866-.015-1.7-2.782.605-3.374-1.34-3.374-1.34-.454-1.15-.99-1.455-.99-1.455-.81-.555.06-.543.06-.543.896.063 1.368.93 1.368.93.795 1.363 2.088.97 2.592.74.08-.578.31-1.076.565-1.32-1.986-.225-4.06-1.0-4.06-4.43 0-.97.347-1.758.917-2.375-.092-.225-.398-1.127.087-2.348 0 0 .75-.237 2.455.91A8.48 8.48 0 0110 3.997c.805.006 1.61.107 2.378.318 1.705-1.147 2.455-.91 2.455-.91.485 1.22.18 2.123.088 2.348.57.617.917 1.405.917 2.375 0 3.438-2.078 4.2-4.068 4.42.32.276.606.83.606 1.674 0 1.21-.01 2.183-.01 2.484 0 .265.18.57.688.47C17.14 18.17 20 14.425 20 10.017A10.015 10.015 0 0010 0z" clipRule="evenodd" />
                        </svg>
                        Σύνδεση με GitHub
                    </button>

                    /* 6. High Contrast Text: Σχεδόν μαύρο (text-bram-text-main) */
                    <p className="mt-8 text-xs font-black text-bram-text-muted uppercase tracking-[0.2em]">
                        Secure Infrastructure Portal
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;