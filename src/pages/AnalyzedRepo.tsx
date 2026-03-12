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
            if (job?.status !== 'COMPLETED' && job?.status !== 'FAILED') {
                fetchJobStatus();
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [jobId, job?.status]);

    if (!job) {
        return (
            <div className="min-h-screen bg-bram-bg flex items-center justify-center">
                <Loader2 className="animate-spin text-bram-accent" size={64} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bram-bg p-8 flex flex-col items-center antialiased">

            {/* 1. Header με υψηλή αντίθεση και ενοποιημένο Branding */}
            <div className="w-full max-w-7xl mb-10 bg-white p-8 rounded-[2.5rem] border-2 border-bram-border shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-4 bg-slate-100 rounded-full hover:bg-bram-accent-light hover:text-bram-accent transition-all border border-transparent hover:border-bram-accent"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-black text-bram-accent uppercase tracking-[0.2em]">Architecture Analysis</span>
                        </div>
                        <h1 className="text-4xl font-black text-bram-text-main tracking-tighter">
                            Analyze: <span className="text-bram-accent">{job.repoName}</span>
                        </h1>
                        <p className="text-bram-text-muted font-bold text-xs uppercase tracking-[0.2em] mt-1">
                            Cloud Platform: <span className="text-bram-text-main">{job.targetCloud}</span> • ID: {job.jobId.slice(0, 8)}
                        </p>
                    </div>
                </div>

                {/* Status Badge: Πράσινο μόνο στο COMPLETED */}
                <div className={`px-8 py-3 rounded-full font-black text-sm border-2 uppercase tracking-widest shadow-sm transition-all duration-500
                    ${job.status === 'COMPLETED'
                    ? 'bg-green-50 text-bram-primary border-bram-primary'
                    : 'bg-blue-50 text-bram-accent border-bram-accent animate-pulse'}`}>
                    {job.status === 'ANALYZING' ? 'Analysing Repository...' : job.status}
                </div>
            </div>

            {/* 2. Split Screen Container */}
            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-10 pb-12">

                {/* ΑΡΙΣΤΕΡΑ: System Prompt (Neutral/Clean) */}
                <div className="bg-white rounded-[2.5rem] border-2 border-bram-border shadow-xl flex flex-col h-[700px] overflow-hidden group">
                    <div className="bg-slate-50 px-8 py-5 border-b-2 border-bram-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Terminal size={20} className="text-bram-text-muted" />
                            <span className="font-black text-[10px] uppercase tracking-[0.3em] text-bram-text-muted">System Instructions</span>
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                        </div>
                    </div>
                    <div className="p-8 overflow-auto flex-1 font-mono text-[13px] text-bram-text-main leading-relaxed bg-white scrollbar-thin">
                        <pre className="whitespace-pre-wrap selection:bg-bram-accent-light selection:text-bram-accent">
                            {job.promptMessage || "Generating optimized system prompt..."}
                        </pre>
                    </div>
                </div>

                {/* ΔΕΞΙΑ: Το Blueprint (Meaningful Blue) */}
                <div className="bg-white rounded-[2.5rem] border-2 border-bram-accent shadow-2xl flex flex-col h-[700px] overflow-hidden relative group">
                    {/* Header με μπλε θέμα */}
                    <div className="bg-bram-accent-light px-8 py-5 border-b-2 border-bram-accent flex items-center gap-3 z-20">
                        <Database size={20} className="text-bram-accent" />
                        <span className="font-black text-[10px] uppercase tracking-[0.3em] text-bram-accent">Generated Infrastructure Blueprint</span>
                    </div>

                    <div className="p-8 overflow-auto flex-1 font-mono text-[13px] text-bram-text-main bg-slate-50/30 relative">
                        {job.status === 'ANALYZING' ? (
                            /* Loading Overlay */
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm z-10 p-10 text-center">
                                <div className="w-20 h-20 border-4 border-bram-accent border-t-transparent border-dashed rounded-full animate-spin mb-8"></div>
                                <h3 className="text-bram-accent font-black text-2xl mb-3 tracking-tight">Gemini is Architecting...</h3>
                                <p className="text-bram-text-muted font-bold text-sm max-w-xs leading-relaxed">
                                    Σαρώνουμε τον κώδικα, εντοπίζουμε τα services και σχεδιάζουμε την ιδανική υποδομή για το {job.targetCloud}.
                                </p>
                            </div>
                        ) : (
                            /* JSON Output με High Contrast */
                            <pre className="whitespace-pre-wrap text-bram-text-main">
                                {job.blueprintJson
                                    ? JSON.stringify(JSON.parse(job.blueprintJson), null, 4)
                                    : "// No blueprint generated yet."}
                            </pre>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AnalyzedRepo;