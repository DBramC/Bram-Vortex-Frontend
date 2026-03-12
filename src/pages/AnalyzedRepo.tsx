import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Loader2, ArrowLeft, Database, Terminal } from 'lucide-react';

interface AnalysisJob {
    jobId: string;
    repoName: string;
    targetCloud: string;
    status: 'ANALYZING' | 'COMPLETED' | 'FAILED';
    promptMessage: string | null;
    blueprintJson: string | null;
}

const AnalyzedRepo: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<AnalysisJob | null>(null);

    // Live Polling για το status της ανάλυσης
    useEffect(() => {
        const fetchJobStatus = async () => {
            try {
                const response = await api.get(`/dashboard/jobs/${jobId}`);
                setJob(response.data);
            } catch (error) {
                console.error("Error fetching job status", error);
            }
        };
        fetchJobStatus();
        const interval = setInterval(() => {
            if (job?.status !== 'COMPLETED' && job?.status !== 'FAILED') fetchJobStatus();
        }, 3000);
        return () => clearInterval(interval);
    }, [jobId, job?.status]);

    if (!job) return (
        <div className="h-screen bg-bram-bg flex items-center justify-center">
            <Loader2 className="animate-spin text-bram-primary" size={64} />
        </div>
    );

    return (
        /* h-screen και overflow-hidden: Η σελίδα είναι fixed, δεν κουνιέται τίποτα */
        <div className="h-screen bg-bram-bg flex flex-col overflow-hidden p-6 lg:p-8 font-sans antialiased">

            {/* 1. Header: Λευκό Card για υψηλή αντίθεση πάνω στο Hacking Green */}
            <div className="w-full max-w-7xl mx-auto mb-8 bg-white p-6 rounded-[2.5rem] border-2 border-bram-border shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-3 bg-slate-100 rounded-full hover:bg-bram-primary-soft hover:text-bram-primary transition-all border-2 border-transparent hover:border-bram-primary"
                        title="Επιστροφή στο Dashboard"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-bram-text-main tracking-tighter">
                            Analyze: <span className="text-bram-primary">{job.repoName}</span>
                        </h1>
                        <p className="text-bram-text-muted font-black text-[10px] uppercase tracking-[0.2em] mt-1">
                            Platform: <span className="text-bram-text-main">{job.targetCloud}</span> • ID: {job.jobId.slice(0, 8)}
                        </p>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={`px-8 py-2.5 rounded-full font-black text-xs border-2 uppercase tracking-widest shadow-sm
                    ${job.status === 'COMPLETED' ? 'bg-emerald-50 text-bram-primary border-bram-primary' : 'bg-blue-50 text-bram-accent border-bram-accent animate-pulse'}`}>
                    {job.status}
                </div>
            </div>

            {/* 2. Terminal Grid: flex-1 για να γεμίζει όλο τον χώρο κάτω από το header */}
            <div className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-4 min-h-0">

                {/* LEFT TERMINAL: System Prompt (Πράσινο Κείμενο) */}
                <div className="bg-terminal-bg rounded-[2rem] border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden h-full">
                    {/* Header Μπάρα Terminal */}
                    <div className="bg-slate-800/50 px-6 py-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <Terminal size={16} className="text-terminal-prompt" />
                            <span className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">System_Prompt.log</span>
                        </div>
                        <div className="flex gap-1.5 opacity-50">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        </div>
                    </div>
                    {/* Περιεχόμενο με εσωτερικό scroll */}
                    <div className="p-7 overflow-auto flex-1 font-mono text-sm leading-relaxed text-terminal-prompt selection:bg-terminal-prompt/20">
                        <pre className="whitespace-pre-wrap lowercase">
                            <span className="opacity-40 mr-2 text-white">$</span>
                            {job.promptMessage || "Initializing secure AI handshake..."}
                        </pre>
                    </div>
                </div>

                {/* RIGHT TERMINAL: Blueprint (Μπλε Κείμενο) */}
                <div className="bg-terminal-bg rounded-[2rem] border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden h-full relative">
                    {/* Header Μπάρα Terminal */}
                    <div className="bg-slate-800/50 px-6 py-3 border-b border-white/5 flex items-center gap-3 flex-shrink-0">
                        <Database size={16} className="text-terminal-blueprint" />
                        <span className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Infrastructure_Blueprint.json</span>
                    </div>

                    {/* Περιεχόμενο με εσωτερικό scroll */}
                    <div className="p-7 overflow-auto flex-1 font-mono text-sm leading-relaxed text-terminal-blueprint selection:bg-terminal-blueprint/20">
                        {job.status === 'ANALYZING' ? (
                            /* Loading Overlay - Matrix Style */
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 bg-terminal-bg/90 backdrop-blur-sm z-10">
                                <Loader2 className="animate-spin text-terminal-blueprint mb-6" size={56} />
                                <h3 className="text-terminal-blueprint font-black text-xl mb-2 tracking-tighter uppercase">Compiling Blueprint...</h3>
                                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Architecting Cloud Infrastructure</p>
                            </div>
                        ) : (
                            <pre className="whitespace-pre-wrap">
                                {job.blueprintJson ? JSON.stringify(JSON.parse(job.blueprintJson), null, 4) : "// Awaiting JSON stream..."}
                            </pre>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AnalyzedRepo;