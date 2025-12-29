import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

// Τύποι δεδομένων
interface Repo {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description: string;
    language: string;
    private: boolean;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [repos, setRepos] = useState<Repo[]>([]);
    const [isLoadingRepos, setIsLoadingRepos] = useState(true);

    // State για Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Έλεγχος Login
    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (!token) navigate('/', { replace: true });
    }, [navigate]);

    // Φόρτωση Repos
    useEffect(() => {
        fetchRepositories();
    }, []);

    const fetchRepositories = async () => {
        try {
            setIsLoadingRepos(true);
            const response = await api.get<Repo[]>('/dashboard/repos');
            if (Array.isArray(response.data)) {
                setRepos(response.data);
            } else {
                setRepos([]);
            }
        } catch (error) {
            console.error("Failed to fetch repos", error);
            setRepos([]);
        } finally {
            setIsLoadingRepos(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        navigate('/', { replace: true });
    };

    const handleOpenAnalyzeModal = (repo: Repo) => {
        setSelectedRepo(repo);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedRepo(null);
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
        <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-10 px-4">

            {/* 1. ΤΙΤΛΟΣ */}
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
                Bram Vortex
            </h1>

            {/* 2. ΛΙΣΤΑ (Box) */}
            <div className="w-full max-w-lg bg-white shadow rounded-lg overflow-hidden mb-6">
                <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        My Repositories
                    </h2>
                </div>

                {isLoadingRepos ? (
                    <div className="p-6 text-center text-gray-500 text-sm">Φόρτωση...</div>
                ) : repos.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-sm">Άδεια λίστα (Δεν βρέθηκαν repositories)</div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {repos.map((repo) => (
                            <li key={repo.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                {/* Όνομα Repo */}
                                <div className="truncate pr-4">
                                    <span className="block text-sm font-medium text-gray-900 truncate">
                                        {repo.name}
                                    </span>
                                    <span className="block text-xs text-gray-500">
                                        {repo.language || 'No language'}
                                    </span>
                                </div>

                                {/* Κουμπί Analyze */}
                                <button
                                    onClick={() => handleOpenAnalyzeModal(repo)}
                                    className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-1.5 px-3 rounded"
                                >
                                    Analyze
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* 3. ΚΟΥΜΠΙ ΑΠΟΣΥΝΔΕΣΗΣ (Μικρό Link στο τέλος) */}
            <button
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-red-500 transition-colors underline"
            >
                Αποσύνδεση
            </button>

            {/* --- MODAL --- */}
            {isModalOpen && selectedRepo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm">
                    <div className="bg-white rounded shadow-lg max-w-sm w-full p-5">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Επιβεβαίωση</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Έναρξη ανάλυσης για το <strong>{selectedRepo.name}</strong>;
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleCloseModal}
                                disabled={isAnalyzing}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded border border-gray-200"
                            >
                                Ακύρωση
                            </button>
                            <button
                                onClick={handleConfirmAnalysis}
                                disabled={isAnalyzing}
                                className="px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded"
                            >
                                {isAnalyzing ? '...' : 'Εκκίνηση'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;