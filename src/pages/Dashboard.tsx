import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { CodeBracketIcon } from '@heroicons/react/24/outline';

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
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">

            {/* 1. ΤΙΤΛΟΣ */}
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    Bram Vortex
                </h1>
                <p className="mt-2 text-sm text-gray-600">Repo Analyzer Dashboard</p>
            </div>

            {/* 2. ΛΙΣΤΑ REPOS */}
            <div className="w-full max-w-2xl bg-white shadow-lg rounded-xl overflow-hidden mb-8">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-800">My Repositories</h2>
                </div>

                {isLoadingRepos ? (
                    <div className="p-10 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <p className="mt-2 text-sm text-gray-500">Φόρτωση...</p>
                    </div>
                ) : repos.length === 0 ? (
                    <div className="p-10 text-center text-gray-400">
                        <CodeBracketIcon className="mx-auto h-12 w-12 text-gray-300" />
                        <p className="mt-2 text-lg font-medium">Άδεια λίστα</p>
                        <p className="text-sm">Δεν βρέθηκαν repositories.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {repos.map((repo) => (
                            <li key={repo.id} className="group p-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150">
                                <div className="flex flex-col">
                                    <span className="text-base font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                        {repo.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {repo.private ? 'Private' : 'Public'} • {repo.language || 'N/A'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleOpenAnalyzeModal(repo)}
                                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
                                >
                                    Analyze
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* 3. ΚΟΥΜΠΙ ΑΠΟΣΥΝΔΕΣΗΣ (Κάτω από τη λίστα, μικρό) */}
            <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-500 hover:text-red-600 hover:underline transition-colors focus:outline-none"
            >
                Αποσύνδεση
            </button>

            {/* --- MODAL (Ίδιο με πριν) --- */}
            {isModalOpen && selectedRepo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Επιβεβαίωση</h3>
                        <p className="text-gray-600 mb-6 text-sm">
                            Θέλετε να ξεκινήσει η ανάλυση για το <strong>{selectedRepo.name}</strong>;
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleCloseModal}
                                disabled={isAnalyzing}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Ακύρωση
                            </button>
                            <button
                                onClick={handleConfirmAnalysis}
                                disabled={isAnalyzing}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
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