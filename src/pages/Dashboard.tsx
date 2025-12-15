import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance'; // 1. Το κάνουμε import

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false); // Για να δείχνουμε ότι κάτι συμβαίνει

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        navigate('/', { replace: true });
    };

    // 2. Εδώ χρησιμοποιούμε ΠΡΑΓΜΑΤΙΚΑ το axios instance
    const handleImportRepo = async () => {
        // Ζητάμε από τον χρήστη ένα URL (προσωρινά με prompt)
        const repoUrl = prompt("Εισάγετε το Git Repository URL:");

        if (!repoUrl) return; // Αν πατήσει Cancel, σταματάμε

        setIsLoading(true);

        try {
            // --- Η ΚΛΗΣΗ ΣΤΟ BACKEND ---
            // Το 'api' θα βάλει αυτόματα το header: Authorization: Bearer <token>
            // Στέλνουμε το repoUrl στο backend
            const response = await api.post('/repo-service/import', {
                url: repoUrl
            });

            console.log("Server Response:", response.data);
            alert(`Επιτυχία! Το Backend απάντησε: ${JSON.stringify(response.data)}`);

        } catch (error: any) {
            console.error("Error importing repo:", error);
            // Επειδή δεν έχεις το endpoint ακόμα, θα μπει εδώ.
            // Αλλά αυτό επιβεβαιώνει ότι το Axios προσπάθησε να μιλήσει!
            alert("Το αίτημα στάλθηκε (μαζί με το Token), αλλά το Backend έβγαλε σφάλμα (λογικό αν δεν υπάρχει το endpoint).");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="p-8 bg-white shadow-2xl rounded-xl w-full max-w-lg border-t-4 border-indigo-600">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                        Bram Vortex
                    </h1>
                    <p className="text-gray-500">
                        CI/CD & Repository Management
                    </p>
                </div>

                <div className="space-y-4">

                    {/* IMPORT REPO BUTTON */}
                    <button
                        onClick={handleImportRepo}
                        disabled={isLoading} // Κλειδώνει όσο φορτώνει
                        className={`group w-full flex items-center justify-center px-6 py-4 border border-transparent text-lg font-bold rounded-xl text-white shadow-lg transition-all duration-300 transform hover:-translate-y-1
                        ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl'}`}
                    >
                        {isLoading ? (
                            // Spinner αν φορτώνει
                            <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            // Icon: Cloud Download
                            <svg className="w-8 h-8 mr-3 text-indigo-200 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        )}
                        {isLoading ? 'Sending Request...' : 'Import Repo'}
                    </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase tracking-widest">Account</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition duration-200"
                    >
                        Αποσύνδεση
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;