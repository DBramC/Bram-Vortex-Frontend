import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Loader2, ChevronLeft, MapPin, Cloud, Server, ChevronDown } from 'lucide-react';

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
        { id: 'germanywestcentral', label: 'Germany West Central' },
        { id: 'westeurope', label: 'West Europe' },
        { id: 'eastus', label: 'East US' },
        { id: 'northeurope', label: 'North Europe' },
    ],
    'On-Premise': [
        { id: 'local-dc', label: 'Default Local Datacenter' },
    ]
};

export default function AnalysisParameters() {
    const location = useLocation();
    const navigate = useNavigate();

    const { repoId, repoName, repoUrl, targetCloud, computeType } = location.state || {};

    // Βρίσκουμε τα διαθέσιμα regions για τον πάροχο που επιλέχθηκε
    const availableRegions = CLOUD_REGIONS[targetCloud] || CLOUD_REGIONS['AWS'];

    // State
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-bram-bg text-bram-text-main antialiased font-sans p-6 pb-32">
            <div className="w-full max-w-xl bg-white border-2 border-bram-border rounded-[2.5rem] p-8 sm:p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* --- HEADER --- */}
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black tracking-tighter text-bram-text-main mb-2">
                        Deployment <span className="text-bram-primary">Config</span>
                    </h2>
                    <p className="text-xs font-black text-bram-text-muted uppercase tracking-[0.2em]">
                        {repoName}
                    </p>
                </div>

                {/* --- SUMMARY --- */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="px-5 py-4 rounded-2xl border-2 border-bram-border bg-slate-50 flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-bram-text-muted flex items-center gap-2">
                            <Cloud size={14} className="text-bram-primary" /> Provider
                        </span>
                        <span className="text-base font-black text-bram-text-main">{targetCloud}</span>
                    </div>
                    <div className="px-5 py-4 rounded-2xl border-2 border-bram-border bg-slate-50 flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-bram-text-muted flex items-center gap-2">
                            <Server size={14} className="text-bram-primary" /> Compute
                        </span>
                        <span className="text-base font-black text-bram-text-main capitalize">{computeType}</span>
                    </div>
                </div>

                {/* --- DYNAMIC REGION SELECT --- */}
                <div className="mb-10 relative">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-bram-primary">
                        <MapPin size={16} /> Target Region
                    </label>

                    <button
                        type="button"
                        onClick={() => setIsRegionMenuOpen(!isRegionMenuOpen)}
                        className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 transition-all outline-none bg-bram-primary-soft/30
                        ${isRegionMenuOpen ? 'border-bram-primary shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-bram-primary/40 hover:border-bram-primary'}`}
                    >
                        <div className="flex flex-col items-start">
                            <span className="text-base font-black text-bram-text-main">{selectedRegionObj?.label}</span>
                            <span className="text-[10px] font-bold text-bram-primary/60 uppercase">{targetRegion}</span>
                        </div>
                        <ChevronDown size={20} className={`transition-transform duration-300 ${isRegionMenuOpen ? 'rotate-180' : ''} text-bram-primary`} />
                    </button>

                    {isRegionMenuOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border-2 border-bram-primary bg-white shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {availableRegions.map(region => (
                                <button
                                    key={region.id}
                                    className="w-full flex flex-col px-5 py-3 hover:bg-bram-primary-soft transition-colors text-left border-b border-bram-primary/5 last:border-0"
                                    onClick={() => {
                                        setTargetRegion(region.id);
                                        setIsRegionMenuOpen(false);
                                    }}
                                >
                                    <span className="font-black text-sm text-bram-text-main">{region.label}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{region.id}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- ACTIONS --- */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-4.5 rounded-2xl border-2 border-bram-border font-black text-sm uppercase tracking-widest text-bram-text-muted hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <ChevronLeft size={20} /> Back
                    </button>

                    <button
                        onClick={handleStartAnalysis}
                        disabled={isAnalyzing}
                        className="flex-1 py-4.5 rounded-2xl bg-bram-primary text-white font-black text-lg hover:bg-bram-primary-hover hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase disabled:opacity-70"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                Creating Blueprint...
                            </>
                        ) : (
                            'Generate Blueprint'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}