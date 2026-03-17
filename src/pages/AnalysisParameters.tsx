import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance'; // Χρησιμοποιούμε το ίδιο api instance με το Dashboard
import { Loader2, ChevronLeft, MapPin, Cloud, Server } from 'lucide-react';

export default function AnalysisParameters() {
    const location = useLocation();
    const navigate = useNavigate();

    // 1. Διαβάζουμε τα δεδομένα που μας "πάσαρε" το Dashboard
    const { repoId, repoName, targetCloud, computeType } = location.state || {};

    // 2. Το μόνο State που χρειαζόμαστε πλέον είναι το Region
    const [targetRegion, setTargetRegion] = useState('eu-central-1');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Προστασία: Αν κάποιος μπει στο /parameters απευθείας (χωρίς να έχει διαλέξει repo),
    // τον γυρνάμε πίσω στο Dashboard.
    useEffect(() => {
        if (!repoId) {
            navigate('/dashboard', { replace: true });
        }
    }, [repoId, navigate]);

    const handleStartAnalysis = async () => {
        if (!repoId) return;

        setIsAnalyzing(true);
        try {
            // Το Payload ταιριάζει ΑΚΡΙΒΩΣ με το AnalysisRequest.java στο Backend
            const payload = {
                repoId: repoId,
                repoName: repoName,
                targetCloud: targetCloud,     // Ήρθε από το Dashboard
                computeType: computeType,     // Ήρθε από το Dashboard
                targetRegion: targetRegion    // Μπήκε σε αυτή την οθόνη
            };

            // Χτυπάμε το ίδιο endpoint που είχαμε
            const response = await api.post('/dashboard/analyze', payload);

            // Παίρνουμε το ID και πάμε στην τελική οθόνη
            const jobId = response.data;
            navigate(`/analyzed-repo/${jobId}`);

        } catch (error) {
            console.error("Analysis failed:", error);
            alert("❌ Σφάλμα κατά την έναρξη της ανάλυσης.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!repoId) return null; // Κρύβει το UI μέχρι να γίνει το redirect

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

                {/* --- SUMMARY (Τι επέλεξε στο Dashboard) --- */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="px-5 py-4 rounded-2xl border-2 border-bram-border bg-slate-50 flex flex-col gap-1.5 transition-all hover:border-bram-primary/30">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-bram-text-muted flex items-center gap-2">
                            <Cloud size={14} className="text-bram-primary" /> Provider
                        </span>
                        <span className="text-base font-black text-bram-text-main">{targetCloud}</span>
                    </div>

                    <div className="px-5 py-4 rounded-2xl border-2 border-bram-border bg-slate-50 flex flex-col gap-1.5 transition-all hover:border-bram-primary/30">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-bram-text-muted flex items-center gap-2">
                            <Server size={14} className="text-bram-primary" /> Compute
                        </span>
                        <span className="text-base font-black text-bram-text-main capitalize">{computeType}</span>
                    </div>
                </div>

                {/* --- REGION INPUT --- */}
                <div className="mb-10 relative">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-bram-primary">
                        <MapPin size={16} /> Target Region
                    </label>
                    <input
                        type="text"
                        value={targetRegion}
                        onChange={(e) => setTargetRegion(e.target.value)}
                        placeholder="e.g. eu-central-1, us-east-1"
                        className="w-full px-5 py-4 rounded-xl border-2 border-bram-primary/40 focus:border-bram-primary bg-bram-primary-soft/30 text-base font-black text-bram-text-main outline-none transition-all shadow-none focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] placeholder:text-slate-400 placeholder:font-normal"
                    />
                    <p className="text-[11px] font-medium text-slate-400 mt-3 ml-1">
                        Specify the exact datacenter region where the infrastructure will be provisioned.
                    </p>
                </div>

                {/* --- ACTIONS --- */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-4.5 rounded-2xl border-2 border-bram-border font-black text-sm uppercase tracking-widest text-bram-text-muted hover:bg-slate-50 hover:text-bram-text-main transition-all flex items-center justify-center gap-2"
                    >
                        <ChevronLeft size={20} /> Back
                    </button>

                    <button
                        onClick={handleStartAnalysis}
                        disabled={isAnalyzing}
                        className="flex-1 py-4.5 rounded-2xl bg-bram-primary text-white font-black text-lg hover:bg-bram-primary-hover hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase disabled:opacity-70 disabled:hover:translate-y-0 disabled:active:scale-100"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                Analyzing Stack...
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