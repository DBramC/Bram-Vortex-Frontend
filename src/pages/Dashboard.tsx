import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import {
    CircleUser, Code, ChevronRight, LogOut, Loader2,
    ChevronDown, Server, Box, Network
} from 'lucide-react';

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

const AwsIcon = () => (
    <svg viewBox="0 0 64 36" width="34" height="20" fill="currentColor">
        <text x="2" y="24" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="26" fill="currentColor" letterSpacing="-1.5">aws</text>
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

const COMPUTE_OPTIONS = [
    { id: 'Container', label: 'Managed Containers', icon: Box },
    { id: 'Kubernetes', label: 'Kubernetes Cluster', icon: Network },
    { id: 'VM', label: 'Virtual Machines', icon: Server },
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

    const [selectedCompute, setSelectedCompute] = useState<string>('Container');
    const [isComputeMenuOpen, setIsComputeMenuOpen] = useState(false);

    useEffect(() => {
        setIsCloudMenuOpen(false);
        setIsComputeMenuOpen(false);
    }, [selectedRepoId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (listRef.current && !listRef.current.contains(event.target as Node)) {
                setSelectedRepoId(null);
                setIsCloudMenuOpen(false);
                setIsComputeMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
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
            const requestBody = {
                repoId: repo.id,
                repoName: repo.name,
                repoUrl: repo.html_url,
                cloudProvider: selectedCloud,
                computePreference: selectedCompute
            };
            const response = await api.post('/dashboard/analyze', requestBody);
            setSelectedRepoId(null);
            navigate(`/analyzed-repo/${response.data}`);
        } catch (error) {
            console.error("Analysis failed:", error);
            alert("❌ Σφάλμα κατά την έναρξη της ανάλυσης.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ----------------------------------------------------------------------
    // 3. RENDERING
    // ----------------------------------------------------------------------
    return (
        <div className="min-h-screen flex flex-col items-center px-4 py-10 bg-bram-bg text-bram-text-main antialiased">

            {/* User Pill */}
            <div className="w-full max-w-md mb-10 flex justify-center">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-bram-border bg-bram-surface shadow-sm">
                    <CircleUser size={20} className="text-bram-accent" />
                    <span className="font-bold text-sm tracking-tight">{username}</span>
                </div>
            </div>

            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-5xl font-black mb-3 tracking-tighter">
                    Bram <span className="text-bram-primary">Vortex</span>
                </h1>
                <p className="text-bram-text-muted font-bold text-lg">Select a repository to begin analysis</p>
            </div>

            {/* Repository List */}
            <div ref={listRef} className="w-full max-w-lg mb-8 flex flex-col gap-4">

                {isLoadingRepos ? (
                    <div className="p-16 text-center bg-bram-surface rounded-3xl border border-bram-border shadow-sm">
                        <Loader2 className="animate-spin mx-auto mb-4 text-bram-primary" size={40} />
                        <p className="font-bold text-bram-text-muted">Loading repositories...</p>
                    </div>
                ) : repos.length === 0 ? (
                    <div className="p-16 text-center bg-bram-surface rounded-3xl border border-bram-border shadow-sm">
                        <p className="font-bold text-bram-text-muted">No repositories found.</p>
                    </div>
                ) : (
                    repos.map((repo) => {
                        const isSelected = selectedRepoId === repo.id;

                        const selectedCloudObj = CLOUD_PROVIDERS.find(c => c.id === selectedCloud);
                        const SelectedCloudIcon = selectedCloudObj?.icon || Box;
                        const selectedComputeObj = COMPUTE_OPTIONS.find(c => c.id === selectedCompute);
                        const SelectedComputeIcon = selectedComputeObj?.icon || Box;

                        return (
                            <div key={repo.id} className="relative transition-all duration-300">
                                <div
                                    className={`
                                        group transition-all duration-500 ease-out rounded-2xl border-2 overflow-hidden
                                        ${isSelected
                                        ? 'bg-bram-surface border-bram-primary scale-[1.05] shadow-2xl z-30'
                                        : 'bg-bram-surface border-transparent hover:border-bram-accent/30 hover:scale-[1.02] hover:shadow-lg z-10'
                                    }
                                    `}
                                >
                                    <button
                                        className="w-full px-6 py-5 flex items-center gap-5 outline-none cursor-pointer"
                                        onClick={() => setSelectedRepoId(isSelected ? null : repo.id)}
                                    >
                                        <div className={`
                                            flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-colors
                                            ${isSelected ? 'bg-green-100 text-bram-primary' : 'bg-bram-accent-light text-bram-accent'}
                                        `}>
                                            <Code size={28} strokeWidth={2.5} />
                                        </div>

                                        <div className="flex-1 text-left">
                                            <div className={`font-black truncate text-xl tracking-tight ${isSelected ? 'text-bram-primary' : 'text-bram-text-main'}`}>
                                                {repo.name}
                                            </div>
                                            <div className="text-bram-text-muted text-sm font-bold uppercase tracking-wider mt-0.5">
                                                {repo.language || 'Plain Text'} • {repo.private ? 'Private' : 'Public'}
                                            </div>
                                        </div>

                                        <ChevronRight
                                            size={24}
                                            className={`transition-all duration-500 ${isSelected ? 'rotate-90 text-bram-primary scale-125' : 'text-slate-300'}`}
                                        />
                                    </button>

                                    {isSelected && (
                                        <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="h-px bg-bram-border mb-6 w-full opacity-60" />

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                                {/* Target Cloud Dropdown */}
                                                <div className="relative">
                                                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2 text-bram-text-muted">Target Cloud</label>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); setIsCloudMenuOpen(!isCloudMenuOpen); setIsComputeMenuOpen(false); }}
                                                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all outline-none bg-white
                                                            ${isCloudMenuOpen ? 'border-bram-accent' : 'border-bram-border hover:border-slate-400'}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <SelectedCloudIcon />
                                                            <span className="text-sm font-bold">{selectedCloudObj?.label}</span>
                                                        </div>
                                                        <ChevronDown size={18} className={`transition-transform duration-300 ${isCloudMenuOpen ? 'rotate-180 text-bram-accent' : ''}`} />
                                                    </button>
                                                    {isCloudMenuOpen && (
                                                        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border-2 border-bram-border bg-white shadow-2xl z-50 overflow-hidden">
                                                            {CLOUD_PROVIDERS.map(opt => (
                                                                <button key={opt.id} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors font-bold text-sm"
                                                                        onClick={(e) => { e.stopPropagation(); setSelectedCloud(opt.id); setIsCloudMenuOpen(false); }}>
                                                                    <opt.icon /> {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Compute Infra Dropdown */}
                                                <div className="relative">
                                                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2 text-bram-text-muted">Infrastructure</label>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); setIsComputeMenuOpen(!isComputeMenuOpen); setIsCloudMenuOpen(false); }}
                                                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all outline-none bg-white
                                                            ${isComputeMenuOpen ? 'border-bram-accent' : 'border-bram-border hover:border-slate-400'}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <SelectedComputeIcon size={18} className="text-bram-accent" />
                                                            <span className="text-sm font-bold">{selectedComputeObj?.label}</span>
                                                        </div>
                                                        <ChevronDown size={18} className={`transition-transform duration-300 ${isComputeMenuOpen ? 'rotate-180 text-bram-accent' : ''}`} />
                                                    </button>
                                                    {isComputeMenuOpen && (
                                                        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border-2 border-bram-border bg-white shadow-2xl z-50 overflow-hidden">
                                                            {COMPUTE_OPTIONS.map(opt => (
                                                                <button key={opt.id} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors font-bold text-sm"
                                                                        onClick={(e) => { e.stopPropagation(); setSelectedCompute(opt.id); setIsComputeMenuOpen(false); }}>
                                                                    <opt.icon size={18} className="text-bram-accent" /> {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Confirm Button */}
                                            <div className="flex gap-3">
                                                <button
                                                    className="px-6 py-4 rounded-xl border-2 border-bram-border font-bold text-bram-text-muted hover:bg-slate-50 transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedRepoId(null); }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleConfirmAnalysis(repo); }}
                                                    disabled={isAnalyzing}
                                                    className="flex-1 py-4 rounded-xl bg-bram-primary text-white font-black text-lg shadow-xl shadow-green-200 hover:bg-bram-primary-hover hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : 'ANALYZE REPOSITORY'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Logout */}
            <div className="w-full max-w-md">
                <button
                    className="w-full px-6 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all text-bram-text-muted bg-white border-2 border-bram-border hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    onClick={handleLogout}
                >
                    <LogOut size={22} />
                    <span>Log out of session</span>
                </button>
            </div>
        </div>
    );
}