import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { CircleUser, Code, ChevronRight, LogOut, Loader2 } from 'lucide-react';

// ----------------------------------------------------------------------
// 1. ΤΥΠΟΙ ΔΕΔΟΜΕΝΩΝ
// ----------------------------------------------------------------------
interface Repo {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description: string;
    language: string;
    private: boolean;
}

// ----------------------------------------------------------------------
// 2. COMPONENT DASHBOARD
// ----------------------------------------------------------------------
export default function Dashboard() {
    const navigate = useNavigate();

    // Αρχικοποιούμε με άδεια λίστα, καθώς δεν υπάρχουν πια dummy data
    const [repos, setRepos] = useState<Repo[]>([]);
    const [username, setUsername] = useState<string>("User");

    // Ξεκινάμε με true για να δείξουμε το Spinner μέχρι να απαντήσει το API
    const [isLoadingRepos, setIsLoadingRepos] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // --- STATE DESIGN ---
    const [expandedRepoId, setExpandedRepoId] = useState<number | null>(null);

    // ----------------------------------------------------------------------
    // 3. EFFECTS & LOGIC
    // ----------------------------------------------------------------------

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            navigate('/', { replace: true });
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUsername(payload.sub || payload.username || "User");
        } catch (e) {
            console.error("Error decoding token", e);
        }

        fetchRepositories();
    }, [navigate]);

    const fetchRepositories = async () => {
        try {
            setIsLoadingRepos(true);
            const response = await api.get<Repo[]>('/dashboard/repos');

            if (Array.isArray(response.data)) {
                setRepos(response.data);
            } else {
                setRepos([]); // Αν δεν είναι πίνακας, αδειάζουμε τη λίστα
            }
        } catch (error) {
            console.error("Failed to fetch repos", error);
            setRepos([]); // Σε περίπτωση λάθους, αδειάζουμε τη λίστα
        } finally {
            setIsLoadingRepos(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        navigate('/', { replace: true });
    };

    const handleConfirmAnalysis = async (repo: Repo) => {
        try {
            setIsAnalyzing(true);
            const requestBody = {
                repoId: repo.id,
                repoName: repo.name,
                repoUrl: repo.html_url
            };
            const response = await api.post('/dashboard/analyze', requestBody);

            setExpandedRepoId(null);
            alert(`✅ Η ανάλυση ξεκίνησε!\nJob ID: ${response.data}`);
        } catch (error) {
            console.error("Analysis failed:", error);
            alert("❌ Σφάλμα: Η ανάλυση δεν μπόρεσε να ξεκινήσει.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ----------------------------------------------------------------------
    // 4. RENDERING
    // ----------------------------------------------------------------------
    return (
        <div className="min-h-screen flex flex-col items-center px-4 py-6 font-sans" style={{ backgroundColor: '#1a1a1a' }}>

            {/* --- USER PILL --- */}
            <div className="w-full max-w-md mb-8 flex justify-start">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full border shadow-sm"
                     style={{ backgroundColor: '#2d2d2d', borderColor: '#404040' }}>
                    <CircleUser size={20} color="#e5e5e5" />
                    <span style={{ color: '#e5e5e5', fontSize: '0.9rem', fontWeight: 500 }}>{username}</span>
                </div>
            </div>

            {/* --- HEADER --- */}
            <div className="text-center mb-8">
                <h1 className="text-white mb-2 font-bold tracking-tight" style={{ fontSize: '2.5rem' }}>Bram Vortex</h1>
                <p style={{ color: '#9ca3af' }}>My Repositories</p>
            </div>

            {/* --- REPOSITORY LIST CARD --- */}
            <div className="w-full max-w-md mb-4 rounded-xl overflow-visible"
                 style={{ backgroundColor: '#2d2d2d' }}>

                {isLoadingRepos ? (
                    <div className="p-8 text-center" style={{ color: '#9ca3af' }}>
                        <Loader2 className="animate-spin mx-auto mb-2" color="#6366f1" />
                        <p>Loading repositories...</p>
                    </div>
                ) : repos.length === 0 ? (
                    <div className="p-8 text-center" style={{ color: '#9ca3af' }}>
                        <p>No repositories found.</p>
                    </div>
                ) : (
                    repos.map((repo, index) => {
                        const isExpanded = expandedRepoId === repo.id;

                        return (
                            <div key={repo.id} className="relative" style={isExpanded ? { zIndex: 10 } : undefined}>
                                <div
                                    className="transition-all duration-300 ease-in-out"
                                    style={isExpanded ? {
                                        backgroundColor: '#3d3d3d',
                                        transform: 'scale(1.05)',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)',
                                        borderRadius: '12px',
                                        margin: '10px 0'
                                    } : undefined}
                                >
                                    <button
                                        className="w-full px-4 py-4 flex items-center gap-4 hover:opacity-90 transition-opacity"
                                        onClick={() => setExpandedRepoId(isExpanded ? null : repo.id)}
                                    >
                                        {/* Icon Container */}
                                        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                                             style={{ backgroundColor: '#1a1a1a' }}>
                                            <Code size={20} color={isExpanded ? "#818cf8" : "#6366f1"} />
                                        </div>

                                        {/* Repository Info */}
                                        <div className="flex-1 text-left overflow-hidden">
                                            <div className="text-white font-medium truncate">{repo.name}</div>
                                            <div className="text-xs truncate" style={{ color: '#9ca3af' }}>
                                                {repo.language || 'Unknown'} • {repo.private ? 'Private' : 'Public'}
                                            </div>
                                        </div>

                                        {/* Chevron */}
                                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                                            <ChevronRight size={20} color="#6366f1" />
                                        </div>
                                    </button>

                                    {/* Action Buttons */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <button
                                                className="flex-1 px-2 py-2 rounded-lg transition-colors hover:bg-opacity-80 font-medium"
                                                style={{ backgroundColor: '#2d2d2d', color: '#e5e5e5', fontSize: '0.875rem' }}
                                                onClick={() => setExpandedRepoId(null)}
                                                disabled={isAnalyzing}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="flex-1 px-2 py-2 rounded-lg transition-colors hover:bg-opacity-90 font-medium flex justify-center items-center gap-2"
                                                style={{ backgroundColor: '#6366f1', color: 'white', fontSize: '0.875rem' }}
                                                onClick={() => handleConfirmAnalysis(repo)}
                                                disabled={isAnalyzing}
                                            >
                                                {isAnalyzing ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    'Confirm'
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Separator */}
                                {index < repos.length - 1 && !isExpanded && expandedRepoId !== repos[index + 1].id && (
                                    <div className="mx-4" style={{ height: '1px', backgroundColor: '#404040' }} />
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* --- LOGOUT BUTTON --- */}
            <div className="w-full max-w-md mt-auto mb-4">
                <button
                    className="w-full px-4 py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300"
                    style={{ backgroundColor: '#2d2d2d', border: '1px solid #404040' }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#3d1f1f';
                        e.currentTarget.style.borderColor = '#ef4444';
                        const icon = e.currentTarget.querySelector('svg');
                        const text = e.currentTarget.querySelector('span');
                        if (icon) icon.style.color = '#ef4444';
                        if (text) text.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#2d2d2d';
                        e.currentTarget.style.borderColor = '#404040';
                        const icon = e.currentTarget.querySelector('svg');
                        const text = e.currentTarget.querySelector('span');
                        if (icon) icon.style.color = '#ef4444';
                        if (text) text.style.color = 'white';
                    }}
                    onClick={handleLogout}
                >
                    <LogOut size={20} color="#ef4444" />
                    <span className="text-white font-medium transition-colors">Logout</span>
                </button>
            </div>
        </div>
    );
}