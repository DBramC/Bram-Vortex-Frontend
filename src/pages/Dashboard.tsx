import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
// NEW: Πρόσθεσα το ChevronDown για το βελάκι του Dropdown
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

// Custom SVG Icons για τους Cloud Providers
const AwsIcon = () => (
    <svg viewBox="0 0 64 36" width="34" height="20" fill="currentColor">
        {/* Τα γράμματα 'aws' που παίρνουν αυτόματα το λευκό/γκρι χρώμα του κειμένου σου */}
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

        {/* Το επίσημο πορτοκαλί χαμόγελο (βελάκι) τοποθετημένο ακριβώς από κάτω */}
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

    // NEW: States για το Cloud Dropdown
    const [selectedCloud, setSelectedCloud] = useState<string>('AWS');
    const [isCloudMenuOpen, setIsCloudMenuOpen] = useState(false);

    // Κλείσιμο του Custom Dropdown όταν αλλάζει το επιλεγμένο repo
    useEffect(() => {
        setIsCloudMenuOpen(false);
    }, [selectedRepoId]);

    // Click-Outside για το listRef
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (listRef.current && !listRef.current.contains(event.target as Node)) {
                setSelectedRepoId(null);
                setIsCloudMenuOpen(false); // Κλείνουμε και το dropdown για ασφάλεια
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
            const requestBody = {
                repoId: repo.id,
                repoName: repo.name,
                repoUrl: repo.html_url,
                cloudProvider: selectedCloud // Στέλνουμε το επιλεγμένο cloud στο Backend!
            };
            const response = await api.post('/dashboard/analyze', requestBody);

            setSelectedRepoId(null);
            alert(`✅ Η ανάλυση για ${selectedCloud} ξεκίνησε!\nJob ID: ${response.data}`);
        } catch (error) {
            console.error("Analysis failed:", error);
            alert("❌ Σφάλμα: Η ανάλυση δεν μπόρεσε να ξεκινήσει.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ----------------------------------------------------------------------
    // 3. RENDERING
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
            <div
                ref={listRef}
                className="w-full max-w-md mb-4 rounded-xl"
                style={{ backgroundColor: '#2d2d2d' }}
            >

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
                        const isSelected = selectedRepoId === repo.id;

                        // Βρίσκουμε το αντικείμενο του επιλεγμένου Cloud για να δείξουμε το εικονίδιό του στο κουμπί
                        const selectedCloudObj = CLOUD_PROVIDERS.find(c => c.id === selectedCloud);
                        const SelectedIcon = selectedCloudObj?.icon || AwsIcon;

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

                                    {/* Action Area - Show only for selected repo */}
                                    {isSelected && (
                                        <div className="px-4 pb-4 animate-in fade-in duration-200">

                                            {/* NEW: Custom Cloud Provider Dropdown */}
                                            <div className="mb-4 relative">
                                                <label className="block text-xs mb-1.5" style={{ color: '#9ca3af' }}>Target Cloud Provider:</label>

                                                {/* Dropdown Button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsCloudMenuOpen(!isCloudMenuOpen);
                                                    }}
                                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors outline-none hover:opacity-90"
                                                    style={{
                                                        backgroundColor: '#1a1a1a',
                                                        borderColor: isCloudMenuOpen ? '#6366f1' : '#404040'
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <SelectedIcon />
                                                        <span className="text-sm text-white">{selectedCloudObj?.label}</span>
                                                    </div>
                                                    <ChevronDown size={16} color="#9ca3af" className={`transition-transform ${isCloudMenuOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {/* Dropdown Menu (Ανοίγει από κάτω) */}
                                                {isCloudMenuOpen && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border overflow-hidden shadow-2xl z-50"
                                                         style={{ backgroundColor: '#2d2d2d', borderColor: '#404040' }}>
                                                        {CLOUD_PROVIDERS.map(opt => (
                                                            <button
                                                                key={opt.id}
                                                                className="w-full flex items-center gap-3 px-3 py-3 transition-colors outline-none"
                                                                style={{
                                                                    backgroundColor: selectedCloud === opt.id ? '#3d3d3d' : 'transparent',
                                                                    borderBottom: '1px solid #404040'
                                                                }}
                                                                // Hover εφέ με JS για να ταιριάζει στο inline styling
                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d3d3d'}
                                                                onMouseLeave={(e) => {
                                                                    if (selectedCloud !== opt.id) e.currentTarget.style.backgroundColor = 'transparent';
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedCloud(opt.id);
                                                                    setIsCloudMenuOpen(false);
                                                                }}
                                                            >
                                                                <opt.icon />
                                                                <span className="text-sm text-white">{opt.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Confirm/Cancel Buttons */}
                                            <div className="flex gap-2">
                                                <button
                                                    className="flex-1 px-2 py-2 rounded-lg transition-opacity hover:opacity-80"
                                                    style={{ backgroundColor: '#2d2d2d', color: '#e5e5e5', fontSize: '0.875rem' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedRepoId(null);
                                                        setIsCloudMenuOpen(false);
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="flex-1 px-2 py-2 rounded-lg transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
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
                                        </div>
                                    )}
                                </div>

                                {/* Separator */}
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
                    <span className="text-white">Logout</span>
                </button>
            </div>
        </div>
    );
}