import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import {
    Loader2, ArrowLeft, Database, Terminal, Layers, Cpu, Box,
    ChevronRight, ShieldCheck, Zap, Sparkles
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

                const terminalStatuses = ['COMPLETED', 'FAILED'];
                if (terminalStatuses.includes(response.data.status)) {
                    stopPolling.current = true;
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
    const isReadyForExecution = job.status === 'READY_FOR_EXECUTION';
    const hasCosts = !!job.blueprintJson?.costEstimates;

    return (
        <div className="h-screen bg-bram-bg flex flex-col overflow-hidden p-10 font-sans relative">

            {/* HEADER AREA */}
            <div className="w-full max-w-7xl mx-auto mb-10 bg-white p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl transition-all">
                <div className="flex items-center gap-8">
                    <button onClick={() => navigate('/dashboard')} className="p-4 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><ArrowLeft size={24} /></button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Repo: <span className="text-bram-primary">{job.repoName}</span></h1>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">{job.targetCloud} • Architecture Analysis</p>
                    </div>
                </div>
                <div className={`px-10 py-3 rounded-full font-bold text-xs uppercase tracking-[0.2em] border-2 transition-all duration-500
                    ${isReadyForExecution ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.2)]' :
                    isPendingSelection ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse' :
                        'bg-blue-50 text-bram-primary border-blue-200'}`}>
                    {isReadyForExecution ? "Ready for Execution" : job.status.replace(/_/g, ' ')}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 min-h-0">

                {/* TERMINAL LOGS */}
                <div className="bg-[#0f172a] rounded-[2rem] border-2 border-white/10 flex flex-col overflow-hidden shadow-2xl">
                    <div className="bg-slate-800/50 px-8 py-4 border-b border-white/5 flex items-center gap-4">
                        <Terminal size={18} className="text-emerald-400" />
                        <span className="font-bold text-[10px] uppercase text-slate-400 tracking-[0.2em]">Live_Orchestration_Logs</span>
                    </div>
                    <div className="p-8 overflow-auto flex-1 font-mono text-sm text-emerald-400 scrollbar-hide">
                        <pre className="whitespace-pre-wrap leading-relaxed tracking-tight">{job.promptMessage || "> Initializing Vortex engines..."}</pre>
                        {isReadyForExecution && <div className="mt-4 text-emerald-300 font-black animate-bounce">🏆 [ORCHESTRATOR] VALIDATOR COMPLETED SUCCESSFULLY!</div>}
                    </div>
                </div>

                {/* RIGHT INTERACTIVE PANEL */}
                <div className="bg-[#0f172a] rounded-[2rem] border-2 border-white/10 flex flex-col overflow-hidden relative shadow-2xl">

                    {/* CASE 1: PENDING USER SELECTION */}
                    {isPendingSelection && (
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl z-20 p-10 flex flex-col items-center justify-center animate-in fade-in duration-500">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Select Architecture</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-10 text-center">AI analysis complete. Choose your deployment path.</p>

                            <div className="grid grid-cols-1 gap-4 w-full max-w-md">
                                {hasCosts ? (
                                    Object.entries(job.blueprintJson!.costEstimates!).map(([type, price]) => (
                                        <button key={type} disabled={isSelecting} onClick={() => handleSelectCompute(type)}
                                                className="group bg-white/5 border-2 border-white/5 p-6 rounded-3xl flex items-center justify-between hover:border-bram-primary hover:bg-bram-primary/10 transition-all duration-300">
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
                                    ))
                                ) : (
                                    /* --- COST SKELETON LOADER --- */
                                    [1, 2, 3].map((i) => (
                                        <div key={i} className="w-full h-24 bg-white/5 rounded-3xl border-2 border-white/5 p-6 flex items-center justify-between animate-pulse">
                                            <div className="flex items-center gap-5">
                                                <div className="w-10 h-10 bg-slate-700 rounded-lg"></div>
                                                <div className="space-y-2">
                                                    <div className="w-24 h-3 bg-slate-700 rounded"></div>
                                                    <div className="w-16 h-2 bg-slate-800 rounded"></div>
                                                </div>
                                            </div>
                                            <div className="w-16 h-6 bg-emerald-900/30 rounded"></div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* CASE 2: READY FOR EXECUTION (SUCCESS OVERLAY) */}
                    {isReadyForExecution && (
                        <div className="absolute inset-0 bg-emerald-600/10 backdrop-blur-2xl z-30 p-12 flex flex-col items-center justify-center animate-in zoom-in duration-500">
                            <div className="bg-emerald-500 p-6 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.5)] mb-8">
                                <ShieldCheck size={64} className="text-white" />
                            </div>
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 text-center">Synthesis Validated</h2>
                            <p className="text-emerald-100 text-sm font-bold uppercase tracking-widest mb-12 text-center max-w-sm leading-relaxed">
                                Infrastructure code and deployment pipelines have been generated and verified for compliance.
                            </p>

                            <button
                                onClick={() => navigate(`/dashboard/jobs/${jobId}/diff`)}
                                className="w-full max-w-md py-6 bg-white text-emerald-700 rounded-[2rem] font-black text-xl uppercase tracking-widest flex items-center justify-center gap-4 hover:scale-105 transition-all shadow-2xl active:scale-95"
                            >
                                <Zap fill="currentColor" /> Review & Commit <ChevronRight />
                            </button>

                            <p className="mt-8 text-emerald-400/60 text-[10px] font-bold uppercase tracking-[0.3em]">Codebase: Synchronized & Secured</p>
                        </div>
                    )}

                    {/* DEFAULT: BLUEPRINT VIEW */}
                    <div className="bg-slate-800/50 px-8 py-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Database size={18} className="text-blue-400" />
                            <span className="font-bold text-[10px] uppercase text-slate-400 tracking-[0.2em]">Blueprint_Spec</span>
                        </div>
                        {!job.blueprintJson && (
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-blue-400 animate-pulse" />
                                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">AI Modeling...</span>
                            </div>
                        )}
                    </div>

                    <div className="p-8 overflow-auto flex-1 font-mono text-sm text-blue-400 scrollbar-hide">
                        {job.blueprintJson ? (
                            <pre className="animate-in fade-in duration-700">
                                {JSON.stringify(job.blueprintJson, null, 4)}
                            </pre>
                        ) : (
                            /* --- BLUEPRINT SKELETON LOADER --- */
                            <div className="space-y-4 animate-pulse">
                                <div className="h-4 bg-blue-900/20 rounded w-3/4"></div>
                                <div className="h-4 bg-blue-900/20 rounded w-1/2"></div>
                                <div className="h-4 bg-blue-900/20 rounded w-5/6"></div>
                                <div className="h-4 bg-blue-900/20 rounded w-2/3"></div>
                                <div className="h-4 bg-blue-900/20 rounded w-3/4"></div>
                                <div className="h-4 bg-blue-900/20 rounded w-1/2"></div>
                                <div className="h-4 bg-blue-900/20 rounded w-4/5"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyzedRepo;