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
        <div className="min-h-screen bg-bram-bg flex items-center justify-center">
            <Loader2 className="animate-spin text-bram-primary" size={64} />
        </div>
    );

    return (
        <div className="min-h-screen bg-bram-bg p-8 flex flex-col items-center antialiased">

            {/* Header με υψηλή αντίθεση */}
            <div className="w-full max-w-7xl mb-10 bg-white p-8 rounded-[2.5rem] border-2 border-bram-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/dashboard')} className="p-4 bg-slate-100 rounded-full hover:bg-green-100 hover:text-bram-primary transition-all border-2 border-transparent hover:border-bram-primary">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-bram-text-main tracking-tighter">
                            Analyze: <span className="text-bram-primary">{job.repoName}</span>
                        </h1>
                        <p className="text-bram-text-muted font-bold text-xs uppercase tracking-[0.2em] mt-1">
                            Platform: <span className="text-bram-text-main">{job.targetCloud}</span> • ID: {job.jobId.slice(0, 8)}
                        </p>
                    </div>
                </div>

                <div className={`px-8 py-3 rounded-full font-black text-sm border-2 uppercase tracking-widest
                    ${job.status === 'COMPLETED' ? 'bg-green-50 text-bram-primary border-bram-primary' : 'bg-blue-50 text-bram-accent border-bram-accent animate-pulse'}`}>
                    {job.status}
                </div>
            </div>

            {/* Terminal Windows Container */}
            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-10 pb-12">

                {/* LEFT TERMINAL: System Prompt (Green Text) */}
                <div className="bg-terminal-bg rounded-3xl border-2 border-slate-700 shadow-2xl flex flex-col h-[700px] overflow-hidden">
                    <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Terminal size={18} className="text-terminal-prompt" />
                            <span className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">System_Prompt.log</span>
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                            <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                        </div>
                    </div>
                    <div className="p-8 overflow-auto flex-1 font-mono text-sm leading-relaxed text-terminal-prompt selection:bg-terminal-prompt/20">
                        <pre className="whitespace-pre-wrap">
                            <span className="opacity-50 mr-2">$</span>
                            {job.promptMessage || "Initializing AI instructions..."}
                        </pre>
                    </div>
                </div>

                {/* RIGHT TERMINAL: Blueprint (Blue Text) */}
                <div className="bg-terminal-bg rounded-3xl border-2 border-slate-700 shadow-2xl flex flex-col h-[700px] overflow-hidden relative">
                    <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center gap-3">
                        <Database size={18} className="text-terminal-blueprint" />
                        <span className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Infrastructure_Blueprint.json</span>
                    </div>

                    <div className="p-8 overflow-auto flex-1 font-mono text-sm leading-relaxed text-terminal-blueprint bg-black/20 selection:bg-terminal-blueprint/20">
                        {job.status === 'ANALYZING' ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10">
                                <Loader2 className="animate-spin text-terminal-blueprint mb-6" size={48} />
                                <h3 className="text-terminal-blueprint font-black text-xl mb-2 tracking-tight">EXECUTING AI ANALYSIS...</h3>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Architecting Cloud Components</p>
                            </div>
                        ) : (
                            <pre className="whitespace-pre-wrap">
                                {job.blueprintJson ? JSON.stringify(JSON.parse(job.blueprintJson), null, 4) : "// No data received."}
                            </pre>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AnalyzedRepo;