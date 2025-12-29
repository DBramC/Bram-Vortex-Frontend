import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { CloudArrowDownIcon, StarIcon, CodeBracketIcon, ArrowPathIcon } from '@heroicons/react/24/outline'; // Προαιρετικά εικονίδια (εγκατέστησε heroicons αν θες)

// 1. Το Interface πρέπει να ταιριάζει με το JSON που στέλνει το Spring Boot
interface Repo {
    id: number;
    name: string;
    full_name: string;   // Αντιστοιχεί στο @JsonProperty("full_name")
    html_url: string;    // Αντιστοιχεί στο @JsonProperty("html_url")
    description: string;
    language: string;
    stargazers_count: number; // Αν το έβαλες στο DTO, αλλιώς βγάλτο
    private: boolean;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    // State για τη λίστα των repositories
    const [repos, setRepos] = useState<Repo[]>([]);

    // State για φόρτωση λίστας
    const [isLoadingRepos, setIsLoadingRepos] = useState(true);

    // State για το ποιο repo αναλύεται αυτή τη στιγμή (για να δείχνουμε spinner στο συγκεκριμένο κουμπί)
    const [analyzingRepoId, setAnalyzingRepoId] = useState<number | null>(null);

    // Έλεγχος Auth
    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    // 2. Fetch Repositories μόλις φορτώσει το Component
    useEffect(() => {
        fetchRepositories();
    }, []);

    const fetchRepositories = async () => {
        try {
            setIsLoadingRepos(true);
            const response = await api.get<Repo[]>('/dashboard/repos');

            // --- ΠΡΟΣΘΗΚΗ ΕΛΕΓΧΟΥ ---
            // Ελέγχουμε αν αυτό που ήρθε είναι πραγματικά πίνακας (Array)
            if (Array.isArray(response.data)) {
                setRepos(response.data);
            } else {
                console.error("Unexpected response format:", response.data);
                // Αν δεν είναι πίνακας, πιθανόν είναι HTML από redirect.
                // Μπορούμε να αδειάσουμε τη λίστα για να μην σκάσει το UI.
                setRepos([]);
            }
            // ------------------------

        } catch (error) {
            console.error("Failed to fetch repos:", error);
        } finally {
            setIsLoadingRepos(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        navigate('/', { replace: true });
    };

    // 3. Ξεκινάει την ανάλυση για ΕΝΑ συγκεκριμένο repo
    const handleAnalyze = async (repo: Repo) => {
        setAnalyzingRepoId(repo.id); // Ενεργοποιούμε το spinner μόνο σε αυτό το κουμπί

        try {
            // Δημιουργούμε το request body όπως το περιμένει το AnalysisRequest DTO
            const requestBody = {
                repoId: repo.id,
                repoName: repo.name,
                repoUrl: repo.html_url // ή clone_url αν το έχεις
            };

            // Κλήση στο Endpoint 2 του Spring Boot
            const response = await api.post('/dashboard/analyze', requestBody);

            console.log("Analysis started:", response.data);
            alert(`Η ανάλυση ξεκίνησε για το ${repo.name}! \nJob ID: ${response.data}`); // Αν επιστρέφεις σκέτο string, αλλιώς response.data.jobId

        } catch (error) {
            console.error("Analysis failed:", error);
            alert("Σφάλμα κατά την εκκίνηση της ανάλυσης.");
        } finally {
            setAnalyzingRepoId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header / Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-bold text-indigo-600 tracking-tight">Bram Vortex</h1>
                    <p className="text-xs text-gray-500 font-medium">REPO ANALYZER DASHBOARD</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                >
                    Αποσύνδεση
                </button>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Τα Repositories σου</h2>
                        <p className="mt-1 text-gray-500">Επίλεξε ένα project για να ξεκινήσεις το CI/CD pipeline.</p>
                    </div>
                    <button
                        onClick={fetchRepositories}
                        className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                        <ArrowPathIcon className={`h-5 w-5 ${isLoadingRepos ? 'animate-spin' : ''}`} />
                        <span>Ανανέωση</span>
                    </button>
                </div>

                {/* 4. Λίστα / Grid */}
                {isLoadingRepos ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : repos.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                        <CloudArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Δεν βρέθηκαν repositories</h3>
                        <p className="mt-1 text-sm text-gray-500">Βεβαιώσου ότι ο λογαριασμός GitHub έχει συνδεθεί σωστά.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {repos.map((repo) => (
                            <div
                                key={repo.id}
                                className="bg-white overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 flex flex-col"
                            >
                                <div className="p-6 flex-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`px-2 py-1 text-xs font-bold rounded-md ${repo.private ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                            {repo.private ? 'PRIVATE' : 'PUBLIC'}
                                        </div>
                                        {repo.language && (
                                            <span className="flex items-center text-xs text-gray-500 font-medium">
                                                <div className="h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
                                                {repo.language}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 truncate" title={repo.full_name}>
                                        {repo.name}
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                                        {repo.description || "Χωρίς περιγραφή..."}
                                    </p>

                                    <div className="mt-4 flex items-center space-x-4 text-sm text-gray-400">
                                        <div className="flex items-center">
                                            <StarIcon className="h-4 w-4 mr-1 text-yellow-400" />
                                            {/* Πρέπει να προσθέσεις stargazers_count στο DTO αν θες να εμφανίζεται, αλλιώς σβήστο */}
                                            <span>{repo.stargazers_count || 0}</span>
                                        </div>
                                        <a
                                            href={repo.html_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center hover:text-indigo-600 transition-colors"
                                        >
                                            <CodeBracketIcon className="h-4 w-4 mr-1" />
                                            GitHub
                                        </a>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleAnalyze(repo)}
                                        disabled={analyzingRepoId === repo.id}
                                        className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white transition-all
                                            ${analyzingRepoId === repo.id
                                            ? 'bg-indigo-400 cursor-not-allowed'
                                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow'}`}
                                    >
                                        {analyzingRepoId === repo.id ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Starting...
                                            </>
                                        ) : (
                                            'Run Analysis 🚀'
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;