import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // 1. Διαβάζουμε το ?token=XYZ από το URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (token) {
            console.log("Token received!");
            // 2. Το αποθηκεύουμε στο LocalStorage (Μόνιμη μνήμη browser)
            localStorage.setItem('jwt_token', token);

            // 3. Πάμε στο Dashboard (καθαρίζοντας το URL)
            navigate('/dashboard');
        } else {
            // Αν κάτι πήγε στραβά, πίσω στο Login
            navigate('/');
        }
    }, [navigate]);

    return <h2>Authenticating... please wait ⏳</h2>;
};

export default AuthCallback;