import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Loader2, ChevronLeft, MapPin, Cloud, Server, ChevronDown, ChevronRight } from 'lucide-react';

// --- DATA: REGIONS PER PROVIDER ---
const CLOUD_REGIONS: Record<string, { id: string; label: string }[]> = {
    AWS: [
        { id: 'eu-central-1', label: 'Europe (Frankfurt)' },
        { id: 'eu-west-1', label: 'Europe (Ireland)' },
        { id: 'us-east-1', label: 'US East (N. Virginia)' },
        { id: 'us-west-2', label: 'US West (Oregon)' },
        { id: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    ],
    GCP: [
        { id: 'europe-west3', label: 'Frankfurt (europe-west3)' },
        { id: 'europe-west1', label: 'Belgium (europe-west1)' },
        { id: 'us-central1', label: 'Iowa (us-central1)' },
        { id: 'asia-east1', label: 'Taiwan (asia-east1)' },
    ],
    Azure: [
        { id: 'germany-west-central', label: 'Germany West Central' },
        { id: 'west-europe', label: 'West Europe' },
        { id: 'east-us', label: 'East US' },
        { id: 'north-europe', label: 'North Europe' },
    ],
    'On-Premise': [
        { id: 'local-dc', label: 'Default Local Datacenter' },
    ]
};

export default function AnalysisParameters() {
    const location = useLocation();
    const navigate = useNavigate();

    const { repoId, repoName, repoUrl, targetCloud, computeType } = location.state || {};

    const availableRegions = CLOUD_REGIONS[targetCloud] || CLOUD_REGIONS['AWS'];

    const [targetRegion, setTargetRegion] = useState(availableRegions[0].id);
    const [isRegionMenuOpen, setIsRegionMenuOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        if (!repoId) {
            navigate('/dashboard', { replace: true });
        }
    }, [repoId, navigate]);

    const handleStartAnalysis = async () => {
        if (!repoId) return;
        setIsAnalyzing(true);
        try {
            const payload = {
                repoId,
                repoName,
                repoUrl,
                targetCloud,
                computeType,
                targetRegion
            };
            const response = await api.post('/dashboard/analyze', payload);
            const jobId = response.data;
            navigate(`/analyzed-repo/${jobId}`);
        } catch (error) {
            console.error("Analysis failed:", error);
            alert("❌ Σφάλμα κατά την έναρξη της ανάλυσης.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!repoId) return null;

    const selectedRegionObj = availableRegions.find(r => r.id === targetRegion);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bram-bg text-bram-text-main antialiased font-sans p-10 pb-32">
            {/* Card με αυξημένο πλάτος (max-w-3xl) και Enterprise Padding */}
            <div className="w-full max-w-3xl bg-white border-2 border-bram-border rounded-[3.5rem] p-12 sm:p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* --- HEADER --- */}
                <div className="text-center mb-14">
                    <h2 className="text-5xl font-black tracking-tighter text-bram-text-main mb-3">
                        Deployment <span className="text-bram-primary">Config</span>
                    </h2>
                    <p className="text-sm font-black text-bram-text-muted uppercase tracking-[0.3em]">
                        {repoName}
                    </p>
                </div>

                {/* --- SUMMARY - Αυξημένα μεγέθη και spacing --- */}
                <div className="grid grid-cols-2 gap-6 mb-12">
                    <div className="px-8 py-6 rounded-[2rem] border-2 border-bram-border bg-slate-50 flex flex-col gap-2 shadow-sm">
                        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-bram-text-muted flex items-center gap-3">
                            <Cloud size={16} className="text-bram-primary" /> Provider
                        </span>
                        <span className="text-xl font-black text-bram-text-main">{targetCloud}</span>
                    </div>
                    <div className="px-8 py-6 rounded-[2rem] border-2 border-bram-border bg-slate-50 flex flex-col gap-2 shadow-sm">
                        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-bram-text-muted flex items-center gap-3">
                            <Server size={16} className="text-bram-primary" /> Compute
                        </span>
                        <span className="text-xl font-black text-bram-text-main capitalize">{computeType}</span>
                    </div>
                </div>

                {/* --- DYNAMIC REGION SELECT - Wide and Bold --- */}
                <div className="mb-14 relative">
                    <label className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] mb-4 text-bram-primary ml-1">
                        <MapPin size={18} /> Target Region
                    </label>

                    <button
                        type="button"
                        onClick={() => setIsRegionMenuOpen(!isRegionMenuOpen)}
                        className={`w-full flex items-center justify-between px-8 py-6 rounded-2xl border-2 transition-all outline-none bg-bram-primary-soft/30
                        ${isRegionMenuOpen ? 'border-bram-primary shadow-[0_0_20px_rgba(16,185,129,0.25)]' : 'border-bram-primary/40 hover:border-bram-primary'}`}
                    >
                        <div className="flex flex-col items-start">
                            <span className="text-xl font-black text-bram-text-main">{selectedRegionObj?.label}</span>
                            <span className="text-xs font-bold text-bram-primary/60 uppercase tracking-widest mt-1">{targetRegion}</span>
                        </div>
                        <ChevronDown size={28} className={`transition-transform duration-300 ${isRegionMenuOpen ? 'rotate-180' : ''} text-bram-primary`} />
                    </button>

                    {isRegionMenuOpen && (
                        <div className="absolute top-full left-0 right-0 mt-3 rounded-2xl border-2 border-bram-primary bg-white shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {availableRegions.map(region => (
                                <button
                                    key={region.id}
                                    className="w-full flex flex-col px-8 py-4 hover:bg-bram-primary-soft transition-colors text-left border-b border-bram-primary/5 last:border-0"
                                    onClick={() => {
                                        setTargetRegion(region.id);
                                        setIsRegionMenuOpen(false);
                                    }}
                                >
                                    <span className="font-black text-lg text-bram-text-main">{region.label}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{region.id}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- ACTIONS - Full Width Buttons --- */}
                <div className="flex gap-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-10 py-6 rounded-[1.5rem] border-2 border-bram-border font-black text-sm uppercase tracking-widest text-bram-text-muted hover:bg-slate-50 transition-all flex items-center gap-3"
                    >
                        <ChevronLeft size={24} /> Back
                    </button>

                    <button
                        onClick={handleStartAnalysis}
                        disabled={isAnalyzing}
                        className="flex-1 py-6 rounded-[1.5rem] bg-bram-primary text-white font-black text-2xl hover:bg-bram-primary-hover hover:-translate-y-1.5 transition-all active:scale-95 flex items-center justify-center gap-4 uppercase shadow-xl shadow-emerald-500/20 disabled:opacity-70"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="animate-spin" size={32} />
                                Creating Blueprint...
                            </>
                        ) : (
                            <>
                                Generate Blueprint <ChevronRight size={28} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}