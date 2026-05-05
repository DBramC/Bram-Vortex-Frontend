import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import {
    Cloud, Globe, Zap, Loader2, ChevronDown,
    ChevronRight, MapPin
} from 'lucide-react';

// --- ICONS (Same as Dashboard for consistency) ---
const AwsIcon = () => (
    <svg viewBox="0 0 64 36" width="30" height="18" fill="currentColor">
        <text x="2" y="24" fontFamily="Arial" fontWeight="800" fontSize="26" fill="currentColor">aws</text>
        <path fill="#FF9900" d="M14.07 16.63c-2.31 1.09-5.02 1.48-7.46 1-2.11-.4-3.93-1.4-5.35-2.8-.19-.19-.04-.52.23-.44 3.01.84 6.28.74 9.15-.35 1.26-.48 2.44-1.15 3.5-1.98.23-.19.57.05.43.32-.77.13-1.56 1.44-2.42 2.3-1.15 1.15-2.5 2.11-3.93 2.82-.5.25-1.03.45-1.56.6a.81.81 0 01-1.03-1.01c.15-.54.35-1.05.6-1.55.71-1.44 1.67-2.78 2.82-3.93.86-.86 2.17-1.66 2.3-2.42.27-.14.51.19.32.42-.96 1.15-1.53 2.34-1.92 3.6-.38.82-.53 2.15.38 2.44z"/>
    </svg>
);

const GcpIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="#EA4335" d="M12.22 5.2c-2.48 0-4.66 1.34-5.87 3.32l-3.32-2.32A11.96 11.96 0 0112.22 1c3.12 0 5.96 1.18 8.1 3.12l-2.6 2.82c-1.48-1.08-3.32-1.74-5.5-1.74z"/>
        <path fill="#34A853" d="M22.9 12.2c0-.82-.12-1.6-.32-2.35H12.2v4.6h6.1c-.34 1.6-1.3 3.02-2.68 3.94l3.1 2.6c1.94-1.8 3.18-4.52 3.18-8.8z"/>
        <path fill="#4A90E2" d="M12.22 23c2.95 0 5.42-.98 7.22-2.65l-3.1-2.6c-.95.66-2.18 1.05-4.12 1.05-3.22 0-5.96-2.18-6.94-5.12H1.92v2.7A11.98 11.98 0 0012.22 23z"/>
        <path fill="#FBBC05" d="M5.28 13.68A7.2 7.2 0 014.88 12c0-.58.1-1.15.28-1.68V7.62H1.92A11.96 11.96 0 00.22 12c0 1.92.45 3.74 1.28 5.38l3.78-3.7z"/>
    </svg>
);

const AzureIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="#0089D6">
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

const AnalysisParameters: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [targetCloud, setTargetCloud] = useState('AWS');
    const [targetRegion, setTargetRegion] = useState('eu-central-1');

    // Dropdown state
    const [isCloudMenuOpen, setIsCloudMenuOpen] = useState(false);

    const handleStartAnalysis = async () => {
        setLoading(true);
        try {
            const response = await api.post('/dashboard/analyze', {
                targetCloud,
                targetRegion,
                repoUrl: localStorage.getItem('selectedRepoUrl'),
                repoName: localStorage.getItem('selectedRepoName')
            });
            navigate(`/dashboard/analysis/${response.data}`);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            alert("Failed to start analysis.");
        } finally {
            setLoading(false);
        }
    };

    const selectedCloudObj = CLOUD_PROVIDERS.find(c => c.id === targetCloud);
    const SelectedCloudIcon = selectedCloudObj?.icon || Cloud;

    return (
        <div className="min-h-screen w-full bg-bram-bg flex items-center justify-center p-6">
            <div className="w-full max-w-4xl bg-white rounded-[3.5rem] p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] animate-in zoom-in duration-500">

                <h2 className="text-4xl font-black text-slate-900 mb-12 uppercase tracking-tighter text-left border-l-8 border-bram-primary pl-6">
                    Set Parameters
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                    {/* CLOUD PROVIDER DROPDOWN */}
                    <div className="relative">
                        <label className="flex items-center gap-2 text-[11px] font-bold text-bram-primary uppercase tracking-[0.2em] mb-4">
                            <Cloud size={14} /> Cloud Provider
                        </label>

                        <button
                            type="button"
                            onClick={() => setIsCloudMenuOpen(!isCloudMenuOpen)}
                            className={`w-full flex items-center justify-between px-8 py-6 rounded-[2rem] border-2 transition-all outline-none bg-slate-50
                            ${isCloudMenuOpen ? 'border-bram-primary shadow-lg bg-white' : 'border-slate-100 hover:border-bram-primary/40'}`}
                        >
                            <div className="flex items-center gap-4">
                                <SelectedCloudIcon />
                                <span className="text-lg font-bold text-slate-800">{selectedCloudObj?.label}</span>
                            </div>
                            <ChevronDown size={24} className={`transition-transform duration-300 ${isCloudMenuOpen ? 'rotate-180' : ''} text-bram-primary`} />
                        </button>

                        {isCloudMenuOpen && (
                            <div className="absolute top-full left-0 right-0 mt-4 rounded-[2rem] border-2 border-slate-100 bg-white shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
                                {CLOUD_PROVIDERS.map(opt => (
                                    <button
                                        key={opt.id}
                                        className="w-full flex items-center gap-4 px-8 py-5 hover:bg-blue-50 transition-colors font-bold text-lg text-slate-700 text-left"
                                        onClick={() => { setTargetCloud(opt.id); setIsCloudMenuOpen(false); }}
                                    >
                                        <opt.icon /> {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* REGION INPUT (Styled to match dropdown) */}
                    <div className="relative">
                        <label className="flex items-center gap-2 text-[11px] font-bold text-bram-primary uppercase tracking-[0.2em] mb-4">
                            <MapPin size={14} /> Target Region
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={targetRegion}
                                onChange={(e) => setTargetRegion(e.target.value)}
                                className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-mono text-lg text-slate-800 focus:border-bram-primary focus:bg-white outline-none transition-all pr-14"
                                placeholder="e.g. us-east-1"
                            />
                            <Globe size={22} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-10 py-6 rounded-[2rem] border-2 border-slate-100 font-bold text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleStartAnalysis}
                        disabled={loading}
                        className="flex-1 py-6 bg-bram-primary text-white rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-[0_20px_40px_-10px_rgba(0,186,134,0.4)] flex items-center justify-center gap-4 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Zap size={24} fill="currentColor" />}
                        Initialize AI Blueprinting <ChevronRight size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnalysisParameters;