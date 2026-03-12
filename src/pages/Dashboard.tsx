import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import {
    CircleUser, Code, ChevronRight, LogOut, Loader2,
    ChevronDown, Server, Box, Network
} from 'lucide-react';

// --- DATA TYPES & ICONS ---
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
    const [repos, setRepos] = useState<Repo[]>([]);
    const [username, setUsername] = useState<string>("User");
    const [isLoadingRepos, setIsLoadingRepos] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);

    // Refs Map για να βρίσκουμε τις κάρτες
    const repoRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    const [selectedCloud, setSelectedCloud] = useState<string>('AWS');
    const [isCloudMenuOpen, setIsCloudMenuOpen] = useState(false);
    const [selectedCompute, setSelectedCompute] = useState<string>('Container');
    const [isComputeMenuOpen, setIsComputeMenuOpen] = useState(false);

    // --- AUTO-CENTER LOGIC ---
    useEffect(() => {
        if (selectedRepoId !== null) {
            const element = repoRefs.current.get(selectedRepoId);
            if (element) {
                // Χρησιμοποιούμε 300ms για να προλάβει η κάρτα να "ανοίξει" οπτικά
                setTimeout(() => {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }, 300);
            }
        }
    }, [selectedRepoId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Αν το κλικ δεν είναι μέσα σε κάποια κάρτα, κλείσε την επιλογή
            let clickedInside = false;
            repoRefs.current.forEach((ref) => {
                if (ref.contains(event.target as Node)) clickedInside = true;
            });
            if (!clickedInside) {
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
        if (!token) { navigate('/', { replace: true }); return; }
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUsername(payload.sub || payload.username || "User");
        } catch (e) { console.error("Error decoding token", e); }
        fetchRepositories();
    }, [navigate]);

    const fetchRepositories = async () => {
        try {
            setIsLoadingRepos(true);
            const response = await api.get<Repo[]>('/dashboard/repos');
            setRepos(Array.isArray(response.data) ? response.data : []);
        } catch (error) { console.error("Failed to fetch repos", error); setRepos([]);
        } finally { setIsLoadingRepos(false); }
    };

    const handleLogout = () => { localStorage.removeItem('jwt_token'); navigate('/', { replace: true }); };

    const handleConfirmAnalysis = async (repo: Repo) => {
        try {
            setIsAnalyzing(true);
            const response = await api.post('/dashboard/analyze', {
                repoId: repo.id, repoName: repo.name, repoUrl: repo.html_url,
                cloudProvider: selectedCloud, computePreference: selectedCompute
            });
            setSelectedRepoId(null);
            navigate(`/analyzed-repo/${response.data}`);
        } catch (error) { console.error("Analysis failed:", error); alert("❌ Σφάλμα κατά την έναρξη της ανάλυσης.");
        } finally { setIsAnalyzing(false); }
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-bram-bg text-bram-text-main antialiased font-sans pb-32">

            {/* HEADER AREA - Profile Bubble Left, Title Right */}
            <div className="w-full flex flex-col items-center pt-16 px-4">
                <div className="w-full max-w-3xl bg-bram-header backdrop-blur-md px-10 py-6 rounded-[3rem] border-2 border-white shadow-xl flex items-center gap-8">

                    {/* Profile Bubble Left */}
                    <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-bram-border bg-white shadow-sm shrink-0">
                        <CircleUser size={20} className="text-bram-accent" />
                        <span className="font-black text-xs tracking-tight">{username}</span>
                    </div>

                    {/* Title Group Right */}
                    <div className="flex flex-col border-l-2 border-bram-primary/20 pl-8">
                        <h1 className="text-5xl font-black tracking-tighter leading-tight">
                            Bram <span className="text-bram-primary">Vortex</span>
                        </h1>
                        <p className="text-bram-text-muted font-black text-[10px] tracking-[0.2em] uppercase mt-0.5">Infrastructure Portal</p>
                    </div>
                </div>
            </div>

            {/* REPOSITORY LIST */}
            <div className="w-full max-w-xl px-6 flex flex-col gap-6 mt-16">
                {isLoadingRepos ? (
                    <div className="p-20 text-center bg-white rounded-[2.5rem] border-2 border-bram-border shadow-sm">
                        <Loader2 className="animate-spin mx-auto mb-4 text-bram-accent" size={48} />
                        <p className="font-black text-bram-text-muted uppercase tracking-widest text-xs">Fetching repositories...</p>
                    </div>
                ) : (
                    repos.map((repo) => {
                        const isSelected = selectedRepoId === repo.id;
                        const selectedCloudObj = CLOUD_PROVIDERS.find(c => c.id === selectedCloud);
                        const SelectedCloudIcon = selectedCloudObj?.icon || Box;
                        const selectedComputeObj = COMPUTE_OPTIONS.find(c => c.id === selectedCompute);
                        const SelectedComputeIcon = selectedComputeObj?.icon || Box;

                        return (
                            <div
                                key={repo.id}
                                // Αποθήκευση του Ref για κάθε κάρτα
                                ref={(el) => { if (el) repoRefs.current.set(repo.id, el); else repoRefs.current.delete(repo.id); }}
                                onClick={() => setSelectedRepoId(isSelected ? null : repo.id)}
                                className={`relative transition-all duration-500 cursor-pointer ${isSelected ? 'z-50' : 'z-10'}`}
                            >
                                <div className={`group transition-all duration-500 ease-out rounded-[2.5rem] border-2
                                    ${isSelected ? 'bg-white border-bram-primary scale-[1.05] shadow-2xl' : 'bg-white border-bram-border hover:border-bram-accent/50 hover:scale-[1.02]'}`}>

                                    <div className="w-full px-8 py-6 flex items-center gap-6">
                                        <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center transition-colors
                                            ${isSelected ? 'bg-bram-primary-soft text-bram-primary' : 'bg-bram-accent-light text-bram-accent'}`}>
                                            <Code size={32} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className={`font-black truncate text-2xl tracking-tighter ${isSelected ? 'text-bram-primary' : 'text-bram-text-main'}`}>{repo.name}</div>
                                            <div className="text-bram-text-muted text-xs font-black uppercase tracking-[0.2em] mt-1">{repo.language || 'Code'}</div>
                                        </div>
                                        <ChevronRight size={28} className={`transition-all duration-500 ${isSelected ? 'rotate-90 text-bram-primary scale-125' : 'text-slate-300'}`} />
                                    </div>

                                    {isSelected && (
                                        <div className="px-8 pb-8 pt-2 animate-in fade-in slide-in-from-top-4 duration-500" onClick={(e) => e.stopPropagation()}>
                                            <div className="h-px bg-bram-primary/20 mb-8 w-full" />

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                                                {/* Target Cloud Dropdown */}
                                                <div className="relative">
                                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 text-bram-primary">Target Cloud</label>
                                                    <button type="button" onClick={() => { setIsCloudMenuOpen(!isCloudMenuOpen); setIsComputeMenuOpen(false); }}
                                                            className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 transition-all outline-none bg-bram-primary-soft/30
                                                            ${isCloudMenuOpen ? 'border-bram-primary ring-4 ring-bram-primary/10' : 'border-bram-primary/40 hover:border-bram-primary'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <SelectedCloudIcon />
                                                            <span className="text-sm font-black text-bram-text-main">{selectedCloudObj?.label}</span>
                                                        </div>
                                                        <ChevronDown size={18} className={`transition-transform duration-300 ${isCloudMenuOpen ? 'rotate-180' : ''} text-bram-primary`} />
                                                    </button>
                                                    {isCloudMenuOpen && (
                                                        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border-2 border-bram-primary bg-white shadow-2xl z-[100] overflow-hidden">
                                                            {CLOUD_PROVIDERS.map(opt => (
                                                                <button key={opt.id} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-bram-primary-soft transition-colors font-black text-sm text-bram-text-main text-left"
                                                                        onClick={() => { setSelectedCloud(opt.id); setIsCloudMenuOpen(false); }}><opt.icon /> {opt.label}</button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Infrastructure Dropdown */}
                                                <div className="relative">
                                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 text-bram-primary">Infrastructure</label>
                                                    <button type="button" onClick={() => { setIsComputeMenuOpen(!isComputeMenuOpen); setIsCloudMenuOpen(false); }}
                                                            className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 transition-all outline-none bg-bram-primary-soft/30
                                                            ${isComputeMenuOpen ? 'border-bram-primary ring-4 ring-bram-primary/10' : 'border-bram-primary/40 hover:border-bram-primary'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <SelectedComputeIcon size={20} className="text-bram-primary" />
                                                            <span className="text-sm font-black text-bram-text-main">{selectedComputeObj?.label}</span>
                                                        </div>
                                                        <ChevronDown size={18} className={`transition-transform duration-300 ${isComputeMenuOpen ? 'rotate-180' : ''} text-bram-primary`} />
                                                    </button>
                                                    {isComputeMenuOpen && (
                                                        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border-2 border-bram-primary bg-white shadow-2xl z-[100] overflow-hidden">
                                                            {COMPUTE_OPTIONS.map(opt => (
                                                                <button key={opt.id} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-bram-primary-soft transition-colors font-black text-sm text-bram-text-main text-left"
                                                                        onClick={() => { setSelectedCompute(opt.id); setIsComputeMenuOpen(false); }}><opt.icon size={20} className="text-bram-primary" /> {opt.label}</button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <button className="px-8 py-4.5 rounded-xl border-2 border-bram-primary/40 font-black text-sm uppercase tracking-widest text-bram-primary hover:bg-bram-primary-soft transition-all"
                                                        onClick={() => setSelectedRepoId(null)}>Cancel</button>
                                                <button onClick={() => handleConfirmAnalysis(repo)} disabled={isAnalyzing}
                                                        className="flex-1 py-4.5 rounded-2xl bg-bram-primary text-white font-black text-lg shadow-xl shadow-green-200 hover:bg-bram-primary-hover hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase">
                                                    {isAnalyzing ? <Loader2 className="animate-spin" size={24} /> : 'Generate Infrastructure'}</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Logout Section */}
            <div className="w-full max-w-lg mt-20 flex justify-center px-6">
                <button className="w-full px-8 py-5 rounded-[2rem] flex items-center justify-center gap-4 font-black text-sm uppercase tracking-[0.2em] transition-all text-bram-text-muted bg-white border-2 border-bram-border hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm" onClick={handleLogout}>
                    <LogOut size={22} className="rotate-180" /><span>Terminate Session</span></button>
            </div>
        </div>
    );
}