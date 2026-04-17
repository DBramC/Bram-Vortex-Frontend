import React from 'react';

const KONG_GATEWAY_URL = 'http://localhost';
const GITHUB_AUTH_ENDPOINT = '/oauth2/authorization/github';

const Login: React.FC = () => {
    const handleLogin = () => {
        window.location.href = `${KONG_GATEWAY_URL}${GITHUB_AUTH_ENDPOINT}`;
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-bram-bg p-10 font-sans antialiased">
            {/* Card με Enterprise κλίμακα (max-w-xl) και υψηλή αντίθεση */}
            <div className="p-16 shadow-[0_30px_70px_rgba(0,0,0,0.12)] rounded-[4rem] w-full max-w-xl text-center bg-white border-2 border-bram-border relative overflow-hidden">

                {/* Διακριτική λάμψη branding */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-bram-primary/5 blur-[80px] rounded-full pointer-events-none"></div>

                <div className="relative z-10">
                    {/* Μεγάλο Branding Title */}
                    <h1 className="text-6xl font-black text-bram-text-main tracking-tighter mb-3">
                        Bram <span className="text-bram-primary">Vortex</span>
                    </h1>
                    <p className="text-xl font-bold text-bram-text-muted mb-16 tracking-tight">
                        Cloud Infrastructure Intelligence
                    </p>

                    {/* Μεγάλο Action Button */}
                    <button
                        onClick={handleLogin}
                        className="w-full flex items-center justify-center gap-6 py-6 bg-bram-text-main text-white text-2xl font-black rounded-[1.5rem] shadow-2xl hover:bg-slate-800 transition-all transform hover:-translate-y-1.5 active:scale-95"
                    >
                        <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                        </svg>
                        Connect GitHub
                    </button>

                    {/* Sub-label με αυξημένο spacing */}
                    <p className="mt-14 text-[11px] font-black text-bram-text-muted uppercase tracking-[0.4em] opacity-80">
                        Enterprise Infrastructure Provisioning
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;