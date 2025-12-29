import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { ArrowPathIcon, CodeBracketIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

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

    // --- STATE ΓΙΑ ΤΟ MODAL ΕΠΙΒΕΒΑΙΩΣΗΣ ---
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
        } finally {
            setIsLoadingRepos(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        navigate('/', { replace: true });
    };

    // 1. Όταν πατάει το κουμπί "Analyze" στη λίστα -> Ανοίγει το Modal
    const handleOpenAnalyzeModal = (repo: Repo) => {
        setSelectedRepo(repo);
        setIsModalOpen(true);
    };

    // 2. Όταν πατάει "Ακύρωση" στο Modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedRepo(null);
    };

    // 3. Όταν πατάει "Επιβεβαίωση" στο Modal -> Κάνει το Request
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

            // Κλείνουμε το modal και δείχνουμε μήνυμα επιτυχίας
            setIsModalOpen(false);
            alert(`✅ Η ανάλυση ξεκίνησε!\nJob ID: ${response.data}`); // Ή response.data.jobId αν είναι JSON

        } catch (error) {
            console.error("Analysis failed:", error);
            alert("❌ Σφάλμα: Η ανάλυση δεν μπόρεσε να ξεκινήσει.");
        } finally {
            setIsAnalyzing(false);
            setSelectedRepo(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">

            {/* --- NAVBAR --- */}
            <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">B</div>
                    <span className="text-xl font-bold text-gray-800">Bram Vortex</span>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors text-sm font-medium"
                >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    <span>Αποσύνδεση</span>
                </button>
            </nav>

            {/* --- MAIN CONTENT --- */}
            <main className="max-w-5xl mx-auto px-4 py-10">

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">My Repositories</h2>
                    <button
                        onClick={fetchRepositories}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        title="Ανανέωση λίστας"
                    >
                        <ArrowPathIcon className={`h-6 w-6 ${isLoadingRepos ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* --- ΛΙΣΤΑ REPOS (TABLE STYLE) --- */}
                <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                    {isLoadingRepos ? (
                        <div className="p-10 flex justify-center text-gray-500">Φόρτωση...</div>
                    ) : repos.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">Δεν βρέθηκαν repositories.</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repository</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Γλώσσα</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Κατάσταση</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ενέργειες</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {repos.map((repo) => (
                                <tr key={repo.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{repo.name}</span>
                                            <a href={repo.html_url} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-indigo-600 hover:underline truncate max-w-xs">
                                                {repo.full_name}
                                            </a>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                                        {repo.language ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {repo.language}
                                                </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${repo.private ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                                {repo.private ? 'Private' : 'Public'}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleOpenAnalyzeModal(repo)}
                                            className="text-indigo-600 hover:text-indigo-900 font-semibold bg-indigo-50 px-3 py-1.5 rounded-md border border-indigo-100 hover:bg-indigo-100 transition-all"
                                        >
                                            Analyze
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

            {/* --- CONFIRMATION MODAL --- */}
            {isModalOpen && selectedRepo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
                        <div className="flex items-start space-x-4">
                            <div className="bg-indigo-100 p-2 rounded-full">
                                <CodeBracketIcon className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Έναρξη Ανάλυσης</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Είστε σίγουροι ότι θέλετε να ξεκινήσετε την ανάλυση για το repository <span className="font-semibold text-gray-800">{selectedRepo.name}</span>;
                                    <br/>
                                    Αυτή η διαδικασία μπορεί να πάρει μερικά λεπτά.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={handleCloseModal}
                                disabled={isAnalyzing}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                Ακύρωση
                            </button>
                            <button
                                onClick={handleConfirmAnalysis}
                                disabled={isAnalyzing}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Εκκίνηση...
                                    </>
                                ) : (
                                    'Επιβεβαίωση'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;