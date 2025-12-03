import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('jwt_token');
        if (!storedToken) {
            // Αν δεν έχει token, πέτα τον έξω
            navigate('/', { replace: true });
        } else {
            setToken(storedToken);
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        navigate('/', { replace: true });
    };

    if (!token) {
        // Εμφάνιση loading screen μέχρι να ολοκληρωθεί ο έλεγχος του token
        return (
            // Χρησιμοποιούμε p-8 και h-screen για να εξασφαλίσουμε ορατότητα
            <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
                <div className="p-8 bg-indigo-50 shadow-2xl rounded-xl text-center border border-indigo-200">
                    <h2 className="text-xl font-semibold text-indigo-700 animate-pulse">
                        Έλεγχος κατάστασης σύνδεσης...
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">
                        Φόρτωση δεδομένων
                    </p>
                </div>
            </div>
        );
    }

    return (
        // Χρησιμοποιούμε flexbox για κεντράρισμα, όπως στο Login
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            {/* Κάρτα Dashboard: Μεγάλη, με σκιές */}
            <div className="p-8 bg-white shadow-2xl rounded-xl w-full max-w-2xl">
                <h1 className="text-3xl font-extrabold mb-4 text-indigo-700 text-center">
                    🚀 Bram Vortex Dashboard
                </h1>
                <p className="mb-6 text-gray-600 text-center">
                    Καλωσήρθες! Η συνεδρία σου είναι ενεργή και αυθεντικοποιημένη.
                </p>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                        Session Token (JWT):
                    </label>
                    {/* Token Display Area */}
                    <textarea
                        readOnly
                        rows={6}
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm resize-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={token || ''}
                        placeholder="Το token σας θα εμφανιστεί εδώ..."
                    />
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-lg font-medium rounded-xl shadow-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-red-500 transition duration-300 ease-in-out transform hover:scale-[1.005]"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                    Αποσύνδεση
                </button>
            </div>
        </div>
    );
};

export default Dashboard;