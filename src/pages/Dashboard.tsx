import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { CircleUser, Code, ChevronRight, LogOut, Loader2, ChevronDown } from 'lucide-react';

// ----------------------------------------------------------------------
// 1. DATA TYPES & ICONS
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

// Custom SVG Icons (Διατηρήθηκαν ακριβώς όπως τα ζήτησες!)
const AwsIcon = () => (
    <svg viewBox="0 0 64 36" width="34" height="20" fill="currentColor">
        <text
            x="2"
            y="24"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="900"
            fontSize="26"
            fill="currentColor"
            letterSpacing="-1.5"
        >
            aws
        </text>
        <g transform="translate(6, 9) scale(1.3)">
            <path fill="#FF9900" d="M14.07 16.63c-2.31 1.09-5.02 1.48-7.46 1-2.11-.4-3.93-1.4-5.35-2.8-.19-.19-.04-.52.23-.44 3.01.84 6.28.74 9.15-.35 1.26-.48 2.44-1.15 3.5-1.98.23-.19.57.05.43.32-.77.13-1.56 1.44-2.42 2.3-1.15 1.15-2.5 2.11-3.93 2.82-.5.25-1.03.45-1.56.6a.81.81 0 01-1.03-1.01c.15-.54.35-1.05.6-1.55.71-1.44 1.67-2.78 2.82-3.93.86-.86 2.17-1.66 2.3-2.42.27-.14.51.19.32.42-.96 1.15-1.53 2.34-1.92 3.6-.38.82-.53 2.15.38 2.44z"/>
            <path fill="#FF9900" d="M12.58 10.77a1.69 1.69 0 00-.67-.26 1.96 1.96 0 00-.64.13c-.17.07-.29.19-.29.35 0 .19.13.29.36.34l.77.13a2.43 2.43 0 011.57.86 1.92 1.92 0 01.36 1.2 2.13 2.13 0 01-1 1.82 4.12 4.12 0 01-2.33.58 5.62 5.62 0 01-3.1-.89l.63-1.44a4.53 4.53 0 002.4.75c.43 0 .77-.08 1.01-.22a.72.72 0 00.34-.61c0-.22-.1-.36-.29-.44a1.86 1.86 0 00-.52-.17l-.9-.16a2.4 2.4 0 01-1.49-.8 1.92 1.92 0 01-.42-1.2 2.06 2.06 0 01.92-1.73 3.64 3.64 0 012.11-.55 5.46 5.46 0 012.7.69l-.54 1.28z"/>
        </g>
    </svg>
);

const GcpIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18">
        <path fill="#EA4335" d="M12.22 5.2c-2.48 0-4.66 1.34-5.87 3.32l-3.32-2.32A11.96 11.96 0 0112.22 1c3.12 0 5.96 1.18 8.1 3.12l-2.6 2.82c-1.48-1.08-3.32-1.74-5.5-1.74z"/>
        <path fill="#34A853" d="M22.9 12.2c0-.82-.12-1.6-.32-2.35H12.2v4.6h6.1c-.34 1.6-1.3 3.02-2.68 3.94l3.1 2.6c1.94-1.8 3.18-4.52 3.18-8.8z"/>
        <path fill="#4A90E2" d="M12.22 23c2.95 0 5.42-.98 7.22-2.65l-3.1-2.6c-.95.66-2.18 1.05-4.12 1.05-3.22 0-5.96-2.18-6.94-5.12H1.92v2.7A11.98 11.98 0 0012.22 23z"/>
        <path fill="#FBBC05" d="M5.28 13.68A7.2 7.2 0 014.88 12c0-.58.1-1.15.28-1.68V7.62H1.92A11.96 11.96 0 00.22 12c0 1.92.45 3.74 1.28 5.38l3.78-3.7z"/>
    </svg>
);

const AzureIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="#0089D6">
        <path d="M5.27 21L12 8.78 14.54 13h4.3L12 1 2 18.5 5.27 21z"/>
        <path d="M16.14 13.5L12 6.5 7.86 13.5h8.28z" fill="#005BA1"/>
        <path d="M6 15l-3.5 6H22l-4-6H6z"/>
    </svg>
);

const CLOUD_PROVIDERS = [
    { id: 'AWS', label: 'Amazon Web Services', icon: AwsIcon },
    { id: 'GCP', label: 'Google Cloud Platform', icon: GcpIcon },
    { id: 'Azure', label: 'Microsoft Azure', icon: AzureIcon },
];

export default function Dashboard() {
    const navigate = useNavigate();

    // ----------------------------------------------------------------------
    // 2. STATE & LOGIC
    // ----------------------------------------------------------------------
    const [repos, setRepos] = useState<Repo[]>([]);
    const [username, setUsername] = useState<string>("User");
    const [isLoadingRepos, setIsLoadingRepos] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const [selectedCloud, setSelectedCloud] = useState<string>('AWS');
    const [isCloudMenuOpen, setIsCloudMenuOpen] = useState(false);

    useEffect(() => {
        setIsCloudMenuOpen(false);
    }, [selectedRepoId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (listRef.current && !listRef.current.contains(event.target as Node)) {
                setSelectedRepoId(null);
                setIsCloudMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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
            // Σημείωση: Αφαίρεσα το selectedCompute αφού δεν υπάρχει στο UI αυτού του αρχείου
            const requestBody = {
                repoId: repo.id,
                repoName: repo.name,
                repoUrl: repo.html_url,
                cloudProvider: selectedCloud,
            };

            const response = await api.post('/dashboard/analyze', requestBody);
            setSelectedRepoId(null);
            navigate(`/analyzed-repo/${response.data}`);

        } catch (error) {
            console.error("Analysis failed:", error);
            alert("❌ Σφάλμα: Η ανάλυση δεν μπόρεσε να ξεκινήσει. Ελέγξτε τα logs του server.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ----------------------------------------------------------------------
    // 3. RENDERING (Με το νέο Bram Theme)
    // ----------------------------------------------------------------------
    return (
        <div className="min-h-screen flex flex-col items-center px-4 py-8 bg-bram-bg text-bram-text-main">

            {/* User Pill */}
            <div className="w-full max-w-md mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-bram-border bg-bram-surface shadow-sm">
                    <CircleUser size={20} className="text-bram-primary" />
                    <span className="font-medium text-bram-text-main">{username}</span>
                </div>
            </div>

            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-bram-text-main mb-2 tracking-tight">Bram Vortex</h1>
                <p className="text-bram-text-muted font-medium">My Repositories</p>
            </div>

            {/* Repository List Card */}
            <div
                ref={listRef}
                className="w-full max-w-md mb-6 rounded-2xl bg-bram-surface border border-bram-border shadow-lg overflow-hidden"
            >

                {isLoadingRepos ? (
                    <div className="p-10 text-center text-bram-text-muted">
                        <Loader2 className="animate-spin mx-auto mb-3 text-bram-primary" size={32} />
                        <p>Φόρτωση Repositories...</p>
                    </div>
                ) : repos.length === 0 ? (
                    <div className="p-10 text-center text-bram-text-muted">
                        <p>Δεν βρέθηκαν repositories.</p>
                    </div>
                ) : (
                    repos.map((repo, index) => {
                        const isSelected = selectedRepoId === repo.id;
                        const selectedCloudObj = CLOUD_PROVIDERS.find(c => c.id === selectedCloud);
                        const SelectedIcon = selectedCloudObj?.icon || AwsIcon;

                        return (
                            <div key={repo.id} className="relative group">
                                <div className={`transition-all duration-300 ${isSelected ? 'bg-green-50/50' : 'hover:bg-slate-50'}`}>

                                    {/* Repo Button */}
                                    <button
                                        className="w-full px-5 py-4 flex items-center gap-4 outline-none"
                                        onClick={() => setSelectedRepoId(isSelected ? null : repo.id)}
                                    >
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-green-100 text-bram-primary">
                                            <Code size={24} />
                                        </div>

                                        <div className="flex-1 text-left overflow-hidden">
                                            <div className="font-semibold text-bram-text-main truncate text-lg">{repo.name}</div>
                                            <div className="truncate text-bram-text-muted text-sm mt-0.5">
                                                {repo.language || 'Unknown'} • {repo.private ? 'Private' : 'Public'}
                                            </div>
                                        </div>

                                        <ChevronRight size={20} className={`text-bram-text-muted transition-transform duration-300 ${isSelected ? 'rotate-90 text-bram-primary' : ''}`} />
                                    </button>

                                    {/* Action Area (Dropdowns & Confirm) */}
                                    {isSelected && (
                                        <div className="px-5 pb-5 pt-2 animate-in fade-in slide-in-from-top-4 duration-300 border-t border-bram-border mt-2">

                                            {/* CLOUD PROVIDER */}
                                            <div className="mb-6 relative">
                                                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-bram-text-muted">Target Cloud Provider</label>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setIsCloudMenuOpen(!isCloudMenuOpen); }}
                                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all outline-none bg-white
                                                        ${isCloudMenuOpen ? 'border-bram-primary ring-2 ring-green-100' : 'border-bram-border hover:border-gray-300'}`}
                                                >
                                                    <div className="flex items-center gap-3 text-bram-text-main">
                                                        <SelectedIcon />
                                                        <span className="text-sm font-medium">{selectedCloudObj?.label}</span>
                                                    </div>
                                                    <ChevronDown size={18} className={`text-bram-text-muted transition-transform ${isCloudMenuOpen ? 'rotate-180 text-bram-primary' : ''}`} />
                                                </button>

                                                {/* Dropdown Menu Cloud */}
                                                {isCloudMenuOpen && (
                                                    <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-bram-border bg-bram-surface shadow-xl z-50 overflow-hidden">
                                                        {CLOUD_PROVIDERS.map(opt => (
                                                            <button
                                                                key={opt.id}
                                                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors outline-none
                                                                    ${selectedCloud === opt.id ? 'bg-green-50 text-bram-primary' : 'text-bram-text-main hover:bg-slate-50'}`}
                                                                onClick={(e) => { e.stopPropagation(); setSelectedCloud(opt.id); setIsCloudMenuOpen(false); }}
                                                            >
                                                                <opt.icon />
                                                                <span>{opt.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-3">
                                                <button
                                                    className="flex-1 px-4 py-2.5 rounded-xl border border-bram-border text-bram-text-main font-medium transition-colors hover:bg-slate-50"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedRepoId(null); setIsCloudMenuOpen(false); }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="flex-1 px-4 py-2.5 rounded-xl bg-bram-primary text-white font-medium transition-colors hover:bg-bram-primary-hover flex items-center justify-center gap-2 shadow-sm"
                                                    onClick={(e) => { e.stopPropagation(); handleConfirmAnalysis(repo); }}
                                                    disabled={isAnalyzing}
                                                >
                                                    {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : 'Confirm'}
                                                </button>
                                            </div>

                                        </div>
                                    )}
                                </div>

                                {/* Divider Line */}
                                {index < repos.length - 1 && !isSelected && selectedRepoId !== repos[index + 1]?.id && (
                                    <div className="mx-5 h-px bg-bram-border" />
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Logout Button */}
            <div className="w-full max-w-md">
                <button
                    className="w-full px-4 py-3.5 rounded-xl flex items-center justify-center gap-3 font-medium transition-all text-bram-text-muted bg-transparent border border-bram-border hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    onClick={handleLogout}
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}