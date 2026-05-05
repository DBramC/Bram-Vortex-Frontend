import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import {
    CircleUser, Code, ChevronRight, LogOut, Loader2,
    LayoutDashboard, Zap, Info
} from 'lucide-react';

// --- DATA TYPES ---
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
    const [repos, setRepos] = useState<Repo[]>([]);
    const [username, setUsername] = useState<string>("User");
    const [isLoadingRepos, setIsLoadingRepos] = useState(true);

    const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);
    const repoRefs = useRef<Map<number, HTMLDivElement>>(new Map());

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
        } catch (error) {
            console.error("Failed to fetch repos", error);
        } finally { setIsLoadingRepos(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        navigate('/', { replace: true });
    };

    // --- Καθαρό Navigation προς τα Parameters ---
    const handleProceedToParameters = (repo: Repo) => {
        // Αποθηκεύουμε τα βασικά στοιχεία στο localStorage για να τα βρει το επόμενο βήμα
        localStorage.setItem('selectedRepoUrl', repo.html_url);
        localStorage.setItem('selectedRepoName', repo.name);

        navigate('/parameters', {
            state: {
                repoId: repo.id,
                repoName: repo.name,
                repoUrl: repo.html_url
            }
        });
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-bram-bg text-bram-text-main antialiased font-sans p-10 pb-32">

            {/* HEADER AREA */}
            <div className="w-full flex flex-col items-center pt-8 px-6">
                <div className="w-full max-w-5xl bg-white border-2 border-bram-border rounded-[3rem] px-10 py-8 shadow-2xl flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        {/* Profile */}
                        <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full border-2 border-bram-border bg-slate-50 shadow-sm shrink-0">
                            <CircleUser size={28} className="text-bram-accent" />
                            <span className="font-bold text-lg tracking-normal">{username}</span>
                        </div>
                        {/* Title */}
                        <div className="flex flex-col border-l-2 border-bram-primary/20 pl-10">
                            <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
                                Bram <span className="text-bram-primary">Vortex</span>
                            </h1>
                            <p className="text-bram-text-muted font-bold text-xs tracking-[0.3em] uppercase mt-1">Infrastructure Portal</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-blue-50 px-6 py-3 rounded-full border border-blue-100">
                        <LayoutDashboard size={20} className="text-bram-primary" />
                        <span className="text-bram-primary font-black text-xs uppercase tracking-widest">Select Repository</span>
                    </div>
                </div>
            </div>

            {/* REPOSITORY LIST */}
            <div className="w-full max-w-5xl px-6 flex flex-col gap-8 mt-16">
                {isLoadingRepos ? (
                    <div className="p-32 text-center bg-white rounded-[3rem] border-2 border-bram-border shadow-sm">
                        <Loader2 className="animate-spin mx-auto mb-6 text-bram-primary" size={64} />
                        <p className="font-bold text-bram-text-muted uppercase tracking-[0.2em] text-sm">Fetching your codebase...</p>
                    </div>
                ) : (
                    repos.map((repo) => {
                        const isSelected = selectedRepoId === repo.id;

                        return (
                            <div
                                key={repo.id}
                                ref={(el) => { if (el) repoRefs.current.set(repo.id, el); else repoRefs.current.delete(repo.id); }}
                                onClick={() => setSelectedRepoId(isSelected ? null : repo.id)}
                                className={`relative transition-all duration-500 cursor-pointer ${isSelected ? 'z-50' : 'z-10'}`}
                            >
                                <div className={`group transition-all duration-500 ease-out rounded-[3rem] border-2
                                    ${isSelected ? 'bg-white border-bram-primary scale-[1.03] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)]' : 'bg-white border-bram-border hover:border-bram-primary/40 hover:scale-[1.01]'}`}>

                                    <div className="w-full px-10 py-8 flex items-center gap-10">
                                        <div className={`flex-shrink-0 w-20 h-20 rounded-[2rem] flex items-center justify-center transition-colors
                                            ${isSelected ? 'bg-bram-primary text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                                            <Code size={40} strokeWidth={2} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className={`font-bold truncate text-3xl tracking-tight ${isSelected ? 'text-bram-primary' : 'text-bram-text-main'}`}>{repo.name}</div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-bram-text-muted text-sm font-bold uppercase tracking-[0.2em]">{repo.language || 'Code'}</span>
                                                {repo.private && <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Private</span>}
                                            </div>
                                        </div>
                                        <ChevronRight size={32} className={`transition-all duration-500 ${isSelected ? 'rotate-90 text-bram-primary scale-125' : 'text-slate-300'}`} />
                                    </div>

                                    {isSelected && (
                                        <div className="px-10 pb-10 pt-4 animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
                                            <div className="h-px bg-slate-100 mb-8 w-full" />

                                            <div className="flex flex-col md:flex-row gap-8 items-center bg-slate-50 p-8 rounded-[2rem] border border-slate-100 mb-8">
                                                <div className="p-4 bg-white rounded-2xl shadow-sm">
                                                    <Info className="text-bram-primary" size={32} />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <h4 className="font-black text-slate-900 uppercase tracking-tight text-lg">Ready for Analysis</h4>
                                                    <p className="text-slate-500 text-sm font-medium mt-1">
                                                        Vortex will scan this repository to identify the tech stack and suggest optimal infrastructure models.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <button className="px-10 py-5 rounded-2xl border-2 border-slate-200 font-bold text-xs uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 transition-all"
                                                        onClick={() => setSelectedRepoId(null)}>Back</button>
                                                <button onClick={() => handleProceedToParameters(repo)}
                                                        className="flex-1 py-5 rounded-2xl bg-bram-primary text-white font-black text-xl hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-4 uppercase tracking-[0.1em] shadow-xl">
                                                    <Zap size={24} fill="currentColor" /> Select & Configure <ChevronRight size={24} />
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

            {/* Logout Section */}
            <div className="w-full max-w-5xl mt-24 flex justify-center px-6">
                <button className="w-full px-10 py-6 rounded-[3rem] flex items-center justify-center gap-6 font-bold text-lg uppercase tracking-[0.2em] transition-all text-white/40 bg-white/5 border-2 border-white/10 hover:bg-red-500 hover:text-white hover:border-red-600 shadow-sm" onClick={handleLogout}>
                    <LogOut size={28} className="rotate-180" /><span>Terminate Session</span></button>
            </div>
        </div>
    );
}