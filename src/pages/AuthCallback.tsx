import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [message] = useState('Αυθεντικοποίηση...');
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return; // Αν έχει ήδη τρέξει, σταμάτα
        processed.current = true;

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (token) {
            console.log("✅ Token βρέθηκε:", token);
            localStorage.setItem('jwt_token', token);

            // Άμεση μετάβαση χωρίς καθυστέρηση για δοκιμή
            navigate('/dashboard', { replace: true });
        } else {
            console.error("❌ Δεν βρέθηκε token στο URL");
            navigate('/', { replace: true });
        }
    }, [navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white shadow-xl rounded-lg text-center">
                <h2 className="text-xl font-semibold text-indigo-600">
                    {message}
                </h2>
            </div>
        </div>
    );
};

export default AuthCallback;