import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import {
    Loader2, ArrowLeft, Database, Terminal,  Layers,  Cpu, Box, ChevronRight
} from 'lucide-react';

// --- INTERFACES ---
interface AnalysisJob {
    jobId: string;
    repoName: string;
    targetCloud: string;
    status: string;
    promptMessage: string | null;
    blueprintJson: {
        costEstimates?: Record<string, number>;
        validComputeTypes?: string[];
        [key: string]: unknown;
    } | null;
}

const AnalyzedRepo: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<AnalysisJob | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const stopPolling = useRef(false);

    useEffect(() => {
        const fetchJobStatus = async () => {
            if (stopPolling.current) return;
            try {
                const response = await api.get(`/dashboard/jobs/${jobId}`);
                setJob(response.data);
                const finalStatuses = ['COMPLETED', 'FAILED', 'READY_FOR_EXECUTION'];
                if (finalStatuses.includes(response.data.status)) {
                    stopPolling.current = response.data.status === 'COMPLETED' || response.data.status === 'FAILED';
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) { console.warn("Polling retry..."); }
        };
        fetchJobStatus();
        const intervalId = setInterval(fetchJobStatus, 3000);
        return () => { clearInterval(intervalId); stopPolling.current = true; };
    }, [jobId]);

    const handleSelectCompute = async (type: string) => {
        setIsSelecting(true);
        try {
            await api.post(`/dashboard/jobs/${jobId}/select-compute`, { selectedCompute: type });
            // Το polling θα συνεχίσει και το status θα αλλάξει σε ANALYZING
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) { alert("Selection failed."); } finally { setIsSelecting(false); }
    };

    const getComputeIcon = (type: string) => {
        if (type.includes('Machine')) return <Cpu size={32} />;
        if (type.includes('Container')) return <Box size={32} />;
        return <Layers size={32} />;
    };

    if (!job) return <div className="h-screen bg-bram-bg flex items-center justify-center"><Loader2 className="animate-spin text-bram-primary" size={64} /></div>;

    const isPendingSelection = job.status === 'PENDING_USER_SELECTION';

    return (
        <div className="h-screen bg-bram-bg flex flex-col overflow-hidden p-10 font-sans relative">
            {/* HEADER */}
            <div className="w-full max-w-7xl mx-auto mb-10 bg-white p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-8">
                    <button onClick={() => navigate('/dashboard')} className="p-4 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><ArrowLeft size={24} /></button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Repo: <span className="text-bram-primary">{job.repoName}</span></h1>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">{job.targetCloud} • Architecture Analysis</p>
                    </div>
                </div>
                <div className={`px-10 py-3 rounded-full font-bold text-xs uppercase tracking-[0.2em] border-2 ${isPendingSelection ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse' : 'bg-blue-50 text-bram-primary border-blue-200'}`}>
                    {job.status.replace(/_/g, ' ')}
                </div>
            </div>

            {/* MAIN AREA */}
            <div className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 min-h-0">
                {/* LOGS PANEL */}
                <div className="bg-[#0f172a] rounded-[2rem] border-2 border-white/10 flex flex-col overflow-hidden shadow-2xl">
                    <div className="bg-slate-800/50 px-8 py-4 border-b border-white/5 flex items-center gap-4">
                        <Terminal size={18} className="text-emerald-400" />
                        <span className="font-bold text-[10px] uppercase text-slate-400 tracking-[0.2em]">Terminal_Output</span>
                    </div>
                    <div className="p-8 overflow-auto flex-1 font-mono text-sm text-emerald-400"><pre className="whitespace-pre-wrap">{job.promptMessage || "> Awaiting AI signals..."}</pre></div>
                </div>

                {/* RIGHT PANEL: BLUEPRINT OR SELECTOR */}
                <div className="bg-[#0f172a] rounded-[2rem] border-2 border-white/10 flex flex-col overflow-hidden relative shadow-2xl">
                    {isPendingSelection ? (
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl z-20 p-10 flex flex-col items-center justify-center">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Select Architecture</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-10 text-center">AI analysis complete. Choose your deployment path based on monthly cost.</p>

                            <div className="grid grid-cols-1 gap-4 w-full max-w-md">
                                {job.blueprintJson?.costEstimates && Object.entries(job.blueprintJson.costEstimates).map(([type, price]) => (
                                    <button
                                        key={type}
                                        disabled={isSelecting}
                                        onClick={() => handleSelectCompute(type)}
                                        className="group bg-white/5 border-2 border-white/5 p-6 rounded-3xl flex items-center justify-between hover:border-bram-primary hover:bg-bram-primary/10 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="text-slate-400 group-hover:text-bram-primary transition-colors">{getComputeIcon(type)}</div>
                                            <div className="text-left">
                                                <span className="block text-white font-black text-xs uppercase tracking-widest">{type}</span>
                                                <span className="text-[10px] text-slate-600 font-bold uppercase">Estimated Monthly</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-emerald-400 font-mono font-black text-xl">${price.toFixed(2)}</span>
                                            <ChevronRight className="text-slate-800 group-hover:text-white transition-colors" size={18} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-slate-800/50 px-8 py-4 border-b border-white/5 flex items-center gap-4">
                                <Database size={18} className="text-blue-400" />
                                <span className="font-bold text-[10px] uppercase text-slate-400 tracking-[0.2em]">Blueprint_Spec</span>
                            </div>
                            <div className="p-8 overflow-auto flex-1 font-mono text-sm text-blue-400">
                                <pre>{job.blueprintJson ? JSON.stringify(job.blueprintJson, null, 4) : "// Loading infrastructure schema..."}</pre>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyzedRepo;