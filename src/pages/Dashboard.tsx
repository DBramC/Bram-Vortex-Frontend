import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { UserCircleIcon, CodeBracketIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

interface Repo {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description: string;
    language: string;
    private: boolean;
}

// DUMMY ENTRY ΓΙΑ ΝΑ ΒΛΕΠΕΙΣ ΤΟ DESIGN (Αν δεν υπάρχουν repos)
const DUMMY_REPO: Repo = {
    id: 9999,
    name: "demo-vortex-project",
    full_name: "christos/demo-vortex-project",
    html_url: "#",
    description: "Αυτό είναι ένα δοκιμαστικό repository για να δεις το design.",
    language: "Java",
    private: true
};

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [repos, setRepos] = useState<Repo[]>([]);
    const [username, setUsername] = useState<string>(""); // State για το όνομα χρήστη
    const [isLoadingRepos, setIsLoadingRepos] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            navigate('/', { replace: true });
            return;
        }

        // 1. Αποκωδικοποίηση του Username από το JWT (χωρίς εξωτερική βιβλιοθήκη)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            // Αν το backend στέλνει το username στο 'sub' ή σε custom field 'username'
            setUsername(payload.sub || payload.username || "Unknown User");
        } catch (e) {
            console.error("Error decoding token", e);
        }

        fetchRepositories();
    }, [navigate]);

    const fetchRepositories = async () => {
        try {
            setIsLoadingRepos(true);
            const response = await api.get<Repo[]>('/dashboard/repos');
            if (Array.isArray(response.data) && response.data.length > 0) {
                setRepos(response.data);
            } else {
                // Αν είναι άδεια, βάζουμε το DUMMY για να δεις το design
                setRepos([DUMMY_REPO]);
            }
        } catch (error) {
            console.error("Failed to fetch repos", error);
            // Σε περίπτωση λάθους, δείχνουμε το dummy για να μην είναι κενό
            setRepos([DUMMY_REPO]);
        } finally {
            setIsLoadingRepos(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        navigate('/', { replace: true });
    };

    // Όταν κάνεις κλικ σε ΟΛΗ την κάρτα
    const handleCardClick = (repo: Repo) => {
        setSelectedRepo(repo);
        setIsModalOpen(true);
    };

    const handleConfirmAnalysis = async () => {
        if (!selectedRepo) return;
        try {
            setIsAnalyzing(true);
            const requestBody = {
                repoId: selectedRepo.id,
                repoName: selectedRepo.name,
                repoUrl: selectedRepo.html_url
            };
            const response = await api.post('/dashboard/analyze', requestBody);
            setIsModalOpen(false);
            alert(`✅ Η ανάλυση ξεκίνησε!\nJob ID: ${response.data}`);
        } catch (error) {
            console.error("Analysis failed:", error);
            alert("❌ Σφάλμα: Η ανάλυση δεν μπόρεσε να ξεκινήσει.");
        } finally {
            setIsAnalyzing(false);
            setSelectedRepo(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-gray-100 flex flex-col items-center py-10 px-4 relative font-sans">

            {/* 1. USER INFO (Πάνω Αριστερά) */}
            <div className="absolute top-6 left-6 flex items-center space-x-2 text-gray-400 bg-[#2d2d2d] px-4 py-2 rounded-full shadow-md border border-gray-700">
                <UserCircleIcon className="h-6 w-6 text-indigo-400" />
                <span className="text-sm font-medium tracking-wide">{username}</span>
            </div>

            {/* 2. ΤΙΤΛΟΣ */}
            <div className="mt-12 mb-8 text-center">
                <h1 className="text-4xl font-bold text-white tracking-tight">
                    Bram Vortex
                </h1>
                <p className="mt-2 text-sm text-gray-500">My Repositories</p>
            </div>

            {/* 3. ΛΙΣΤΑ (Box ίδιο στυλ με το Logout button) */}
            {/* Χρησιμοποιούμε bg-[#2d2d2d] που είναι σκούρο γκρι, όπως στις εικόνες */}
            <div className="w-full max-w-md bg-[#2d2d2d] border border-gray-700 rounded-2xl p-4 shadow-xl mb-6">

                {isLoadingRepos ? (
                    <div className="py-8 text-center text-gray-500 animate-pulse">Φόρτωση...</div>
                ) : (
                    <div className="space-y-3">
                        {repos.map((repo) => (
                            // 4. REPO CARD (Καρτέλα)
                            <div
                                key={repo.id}
                                onClick={() => handleCardClick(repo)}
                                className="group cursor-pointer bg-[#383838] hover:bg-[#454545] border border-gray-600 hover:border-indigo-500 rounded-xl p-4 transition-all duration-200 ease-in-out transform hover:-translate-y-1 shadow-sm flex items-center justify-between"
                            >
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <div className="bg-gray-700 p-2 rounded-lg group-hover:bg-indigo-600 transition-colors">
                                        <CodeBracketIcon className="h-5 w-5 text-gray-300 group-hover:text-white" />
                                    </div>
                                    <div className="flex flex-col truncate">
                                        <span className="text-base font-semibold text-gray-100 truncate group-hover:text-white">
                                            {repo.name}
                                        </span>
                                        <span className="text-xs text-gray-400 group-hover:text-gray-300">
                                            {repo.language || 'Unknown'} • {repo.private ? 'Private' : 'Public'}
                                        </span>
                                    </div>
                                </div>

                                {/* Βελάκι που εμφανίζεται στο hover */}
                                <div className="text-gray-500 group-hover:text-indigo-400 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 5. ΚΟΥΜΠΙ ΑΠΟΣΥΝΔΕΣΗΣ (Ίδιο στυλ με τη λίστα) */}
            <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-[#2d2d2d] hover:bg-red-900/30 border border-gray-700 hover:border-red-500/50 text-gray-300 hover:text-red-400 px-6 py-3 rounded-xl transition-all duration-200 shadow-lg"
            >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span className="font-medium">Αποσύνδεση</span>
            </button>

            {/* --- DARK MODAL --- */}
            {isModalOpen && selectedRepo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
                    <div className="bg-[#2d2d2d] border border-gray-600 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in-up">
                        <h3 className="text-xl font-bold text-white mb-2 text-center">Επιβεβαίωση</h3>
                        <p className="text-gray-400 mb-8 text-center text-sm leading-relaxed">
                            Θέλεις να ξεκινήσει η ανάλυση κώδικα για το repository <br/>
                            <span className="text-indigo-400 font-semibold">{selectedRepo.name}</span>;
                        </p>

                        <div className="flex flex-col space-y-3">
                            <button
                                onClick={handleConfirmAnalysis}
                                disabled={isAnalyzing}
                                className="w-full py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAnalyzing ? 'Εκκίνηση...' : 'ΝΑΙ, Ξεκίνα την ανάλυση'}
                            </button>

                            <button
                                onClick={() => setIsModalOpen(false)}
                                disabled={isAnalyzing}
                                className="w-full py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl transition-colors"
                            >
                                Ακύρωση
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;