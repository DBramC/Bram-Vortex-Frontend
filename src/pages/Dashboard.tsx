import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { CircleUser, Code, ChevronRight, LogOut, Loader2 } from 'lucide-react';

// ----------------------------------------------------------------------
// 1. DATA TYPES
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

export default function Dashboard() {
    const navigate = useNavigate();

    // ----------------------------------------------------------------------
    // 2. STATE & LOGIC (Η ΔΙΚΗ ΣΟΥ ΛΕΙΤΟΥΡΓΙΚΟΤΗΤΑ)
    // ----------------------------------------------------------------------
    const [repos, setRepos] = useState<Repo[]>([]);
    const [username, setUsername] = useState<string>("User");
    const [isLoadingRepos, setIsLoadingRepos] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Χρησιμοποιούμε το ID για να ξέρουμε ποιο έχει επιλεγεί (για το Figma scale effect)
    const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);

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

    const handleConfirmAnalysis = async (repo: Repo) => {
        try {
            setIsAnalyzing(true);
            const requestBody = {
                repoId: repo.id,
                repoName: repo.name,
                repoUrl: repo.html_url
            };
            const response = await api.post('/dashboard/analyze', requestBody);

            setSelectedRepoId(null);
            alert(`✅ Η ανάλυση ξεκίνησε!\nJob ID: ${response.data}`);
        } catch (error) {
            console.error("Analysis failed:", error);
            alert("❌ Σφάλμα: Η ανάλυση δεν μπόρεσε να ξεκινήσει.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ----------------------------------------------------------------------
    // 3. RENDERING (ΤΟ DESIGN ΤΟΥ FIGMA EXACT MATCH)
    // ----------------------------------------------------------------------
    return (
        <div className="min-h-screen flex flex-col items-center px-4 py-6" style={{ backgroundColor: '#1a1a1a' }}>

            {/* User Pill */}
            <div className="w-full max-w-md mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full border"
                     style={{ backgroundColor: '#2d2d2d', borderColor: '#404040' }}>
                    <CircleUser size={20} color="#e5e5e5" />
                    <span style={{ color: '#e5e5e5' }}>{username}</span>
                </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-white mb-2" style={{ fontSize: '2.5rem' }}>Bram Vortex</h1>
                <p style={{ color: '#9ca3af' }}>My Repositories</p>
            </div>

            {/* Repository List Card */}
            <div className="w-full max-w-md mb-4 rounded-xl"
                 style={{ backgroundColor: '#2d2d2d' }}>

                {isLoadingRepos ? (
                    // Loading State μέσα στο στυλ του Figma
                    <div className="p-8 text-center" style={{ color: '#9ca3af' }}>
                        <Loader2 className="animate-spin mx-auto mb-2" color="#6366f1" />
                        <p>Loading repositories...</p>
                    </div>
                ) : repos.length === 0 ? (
                    // Empty State μέσα στο στυλ του Figma
                    <div className="p-8 text-center" style={{ color: '#9ca3af' }}>
                        <p>No repositories found.</p>
                    </div>
                ) : (
                    repos.map((repo, index) => {
                        const isSelected = selectedRepoId === repo.id;

                        return (
                            <div key={repo.id} className="relative" style={isSelected ? { zIndex: 10 } : undefined}>
                                <div
                                    className="transition-all duration-300"
                                    style={isSelected ? {
                                        backgroundColor: '#3d3d3d',
                                        transform: 'scale(1.08)',
                                        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.6)',
                                        borderRadius: '12px'
                                    } : undefined}
                                >
                                    <button
                                        className="w-full px-4 py-4 flex items-center gap-4 hover:opacity-80 transition-opacity outline-none"
                                        onClick={() => setSelectedRepoId(isSelected ? null : repo.id)}
                                    >
                                        {/* Icon Container */}
                                        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                                             style={{ backgroundColor: '#1a1a1a' }}>
                                            <Code size={20} color="#6366f1" />
                                        </div>

                                        {/* Repository Info */}
                                        <div className="flex-1 text-left overflow-hidden">
                                            <div className="text-white truncate">{repo.name}</div>
                                            <div className="truncate" style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                                                {repo.language || 'Unknown'} • {repo.private ? 'Private' : 'Active'}
                                            </div>
                                        </div>

                                        {/* Chevron */}
                                        <ChevronRight size={20} color="#6366f1" className={`transition-transform duration-300 ${isSelected ? 'rotate-90' : ''}`} />
                                    </button>

                                    {/* Action Buttons - Show only for selected repo */}
                                    {isSelected && (
                                        <div className="px-4 pb-3 flex gap-2 animate-in fade-in duration-200">
                                            <button
                                                className="flex-1 px-2 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                                                style={{ backgroundColor: '#2d2d2d', color: '#e5e5e5', fontSize: '0.875rem' }}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Σταματάμε το κλικ να κλείσει το card
                                                    setSelectedRepoId(null);
                                                }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="flex-1 px-2 py-1.5 rounded-lg transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                                                style={{ backgroundColor: '#6366f1', color: 'white', fontSize: '0.875rem' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleConfirmAnalysis(repo);
                                                }}
                                                disabled={isAnalyzing}
                                            >
                                                {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : 'Confirm'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Separator - don't show after last item */}
                                {/* Η λογική εδώ: Να μην φαίνεται διαχωριστικό αν είναι το τελευταίο ή αν το τρέχον/επόμενο είναι ανοιχτό */}
                                {index < repos.length - 1 && !isSelected && selectedRepoId !== repos[index + 1]?.id && (
                                    <div className="mx-4" style={{ height: '1px', backgroundColor: '#404040' }} />
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Logout Button Card */}
            <div className="w-full max-w-md">
                <button
                    className="w-full px-4 py-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:border-red-500"
                    style={{ backgroundColor: '#2d2d2d', border: '1px solid #404040' }}
                    // Εδώ κρατάμε το DOM manipulation του Figma για το hover effect
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
                        if (icon) icon.style.color = '#ef4444'; // Κρατάμε το εικονίδιο κόκκινο
                        if (text) text.style.color = 'white';   // Επαναφορά κειμένου σε λευκό
                    }}
                    onClick={handleLogout}
                >
                    <LogOut size={20} color="#ef4444" />
                    <span className="text-white">Logout</span>
                </button>
            </div>
        </div>
    );
}