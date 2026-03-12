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
        /* h-screen και overflow-hidden για να είναι σταθερή η σελίδα */
        <div className="h-screen bg-bram-bg flex flex-col overflow-hidden p-6 lg:p-8 font-sans antialiased">

            {/* 1. Header: Σταθερό ύψος (flex-shrink-0) */}
            <div className="w-full max-w-7xl mx-auto mb-6 bg-white p-6 rounded-[2.5rem] border-2 border-bram-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-3 bg-slate-100 rounded-full hover:bg-green-100 hover:text-bram-primary transition-all border-2 border-transparent hover:border-bram-primary"
                        title="Επιστροφή"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-bram-text-main tracking-tighter">
                            Analyze: <span className="text-bram-primary">{job.repoName}</span>
                        </h1>
                        <p className="text-bram-text-muted font-bold text-xs uppercase tracking-[0.2em] mt-1">
                            Platform: <span className="text-bram-text-main">{job.targetCloud}</span> • ID: {job.jobId.slice(0, 8)}
                        </p>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={`px-8 py-2 rounded-full font-black text-xs border-2 uppercase tracking-widest shadow-sm
                    ${job.status === 'COMPLETED' ? 'bg-green-50 text-bram-primary border-bram-primary' : 'bg-blue-50 text-bram-accent border-bram-accent animate-pulse'}`}>
                    {job.status}
                </div>
            </div>

            {/* 2. Terminal Grid: flex-1 και min-h-0 για να γεμίζει τον χώρο χωρίς να "σπρώχνει" το layout */}
            <div className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-4 min-h-0">

                {/* LEFT TERMINAL: System Prompt (Πράσινο Κείμενο) */}
                <div className="bg-terminal-bg rounded-3xl border-2 border-slate-700 shadow-2xl flex flex-col overflow-hidden h-full">
                    {/* Terminal Header */}
                    <div className="bg-slate-800 px-6 py-3 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <Terminal size={16} className="text-terminal-prompt" />
                            <span className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">System_Prompt.log</span>
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                        </div>
                    </div>
                    {/* Terminal Content: Scrollable */}
                    <div className="p-6 overflow-auto flex-1 font-mono text-sm leading-relaxed text-terminal-prompt selection:bg-terminal-prompt/20">
                        <pre className="whitespace-pre-wrap lowercase">
                            <span className="opacity-50 mr-2 text-white">$</span>
                            {job.promptMessage || "Initializing instructions for AI agent..."}
                        </pre>
                    </div>
                </div>

                {/* RIGHT TERMINAL: Blueprint (Μπλε Κείμενο) */}
                <div className="bg-terminal-bg rounded-3xl border-2 border-slate-700 shadow-2xl flex flex-col overflow-hidden h-full relative">
                    {/* Terminal Header */}
                    <div className="bg-slate-800 px-6 py-3 border-b border-slate-700 flex items-center gap-3 flex-shrink-0">
                        <Database size={16} className="text-terminal-blueprint" />
                        <span className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Infrastructure_Blueprint.json</span>
                    </div>

                    {/* Terminal Content: Scrollable */}
                    <div className="p-6 overflow-auto flex-1 font-mono text-sm leading-relaxed text-terminal-blueprint bg-black/10 selection:bg-terminal-blueprint/20 relative">
                        {job.status === 'ANALYZING' ? (
                            /* Loading Overlay μέσα στο Terminal */
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 bg-terminal-bg/80 backdrop-blur-sm z-10">
                                <Loader2 className="animate-spin text-terminal-blueprint mb-6" size={48} />
                                <h3 className="text-terminal-blueprint font-black text-xl mb-2 tracking-tight uppercase">Executing AI Analysis...</h3>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Architecting Cloud Nodes</p>
                            </div>
                        ) : (
                            /* JSON Output */
                            <pre className="whitespace-pre-wrap">
                                {job.blueprintJson ? JSON.stringify(JSON.parse(job.blueprintJson), null, 4) : "// Awaiting final data stream..."}
                            </pre>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AnalyzedRepo;