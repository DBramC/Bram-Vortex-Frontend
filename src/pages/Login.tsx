import React from 'react';

const Login: React.FC = () => {

    const handleLogin = () => {
        // Στέλνουμε τον χρήστη στο Auth Service (μέσω Kong)
        // Αν το Kong τρέχει στο localhost (port 80), το αφήνουμε έτσι.
        window.location.href = 'http://localhost/oauth2/authorization/github';
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f3f4f6'
        }}>
            <div style={{
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                textAlign: 'center'
            }}>
                <h1 style={{ marginBottom: '1rem', color: '#111827' }}>Bram Vortex 🌪️</h1>
                <p style={{ marginBottom: '2rem', color: '#6b7280' }}>DevOps Automation Platform</p>

                <button
                    onClick={handleLogin}
                    style={{
                        backgroundColor: '#24292e',
                        color: 'white',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Login with GitHub
                </button>
            </div>
        </div>
    );
};

export default Login;