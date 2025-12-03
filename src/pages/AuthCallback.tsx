import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [message, setMessage] = useState('Αυθεντικοποίηση... παρακαλώ περιμένετε ⏳');

    useEffect(() => {
        // 1. Διαβάζουμε το ?token=XYZ από το URL
        // ΣΗΜΕΙΩΣΗ: Αν το token είναι στο Fragment (#token=...) πρέπει να χρησιμοποιηθεί window.location.hash
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (token) {
            console.log("Token received:", token);
            // 2. Το αποθηκεύουμε στο LocalStorage
            localStorage.setItem('jwt_token', token);

            // 3. Επιτυχία - Ανακατεύθυνση στο Dashboard
            setMessage('Επιτυχής σύνδεση! Ανακατεύθυνση στο Dashboard...');

            setTimeout(() => {
                // Καθαρίζουμε το ιστορικό για να μην μπορεί ο χρήστης να γυρίσει πίσω με το 'back'
                navigate('/dashboard', { replace: true });
            }, 500);

        } else {
            // 4. Αποτυχία - Ανακατεύθυνση στο Login
            setMessage('❌ Αποτυχία εύρεσης Token. Επιστροφή στη σελίδα σύνδεσης.');
            setTimeout(() => {
                navigate('/', { replace: true });
            }, 1000);
        }
    }, [navigate]);

    return (
        // Χρησιμοποιούμε το ίδιο κεντράρισμα με το Login component για συνέπεια
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