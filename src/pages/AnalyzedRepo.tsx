import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Loader2, ArrowLeft, Code2, Database } from 'lucide-react';

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
    const navigate = useNavigate(); // Για το κουμπί 'Πίσω'
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
        }, 2000);

        return () => clearInterval(interval);
    }, [jobId, job?.status]);

    if (!job) {
        return (
            <div className="min-h-screen bg-bram-bg flex items-center justify-center">
                <div className="flex flex-col items-center text-bram-text-muted">
                    <Loader2 className="animate-spin mb-4 text-bram-primary" size={40} />
                    <p className="text-lg font-medium">Φόρτωση δεδομένων...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bram-bg p-6 lg:p-10 font-sans text-bram-text-main flex flex-col items-center">

            {/* Header Σελίδας */}
            <div className="w-full max-w-7xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-bram-surface p-6 rounded-2xl border border-bram-border shadow-sm">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2.5 bg-slate-50 border border-bram-border hover:bg-green-50 rounded-full transition-colors text-bram-text-muted hover:text-bram-primary"
                        title="Επιστροφή στο Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-extrabold text-bram-text-main flex items-center gap-3">
                            <Code2 className="text-bram-primary" size={28} />
                            {job.repoName}
                        </h1>
                        <p className="text-bram-text-muted font-medium mt-1">
                            Target Cloud: <span className="text-bram-text-main font-semibold">{job.targetCloud}</span> • Job ID: <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{job.jobId}</span>
                        </p>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={`mt-4 sm:mt-0 px-5 py-2.5 rounded-full font-bold flex items-center gap-3 shadow-sm border
                ${job.status === 'ANALYZING' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                ${job.status === 'COMPLETED' ? 'bg-green-50 text-bram-primary border-green-200' : ''}
                ${job.status === 'FAILED' ? 'bg-red-50 text-red-600 border-red-200' : ''}`}>
                    {job.status === 'ANALYZING' && <Loader2 size={18} className="animate-spin" />}
                    {job.status}
                </div>
            </div>

            {/* Split Screen Container */}
            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* ΑΡΙΣΤΕΡΑ: Το Prompt */}
                <div className="flex flex-col h-[650px] bg-bram-surface rounded-2xl border border-bram-border shadow-md overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-bram-border flex items-center gap-3">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <span className="ml-2 text-xs font-bold text-bram-text-muted uppercase tracking-wider">System Prompt</span>
                    </div>
                    <div className="p-6 overflow-auto flex-1 font-mono text-[13px] text-slate-700 bg-white leading-relaxed">
                        <pre className="whitespace-pre-wrap">{job.promptMessage || "Generating prompt..."}</pre>
                    </div>
                </div>

                {/* ΔΕΞΙΑ: Η απάντηση (Blueprint) */}
                <div className="flex flex-col h-[650px] bg-bram-surface rounded-2xl border border-bram-border shadow-md overflow-hidden relative">
                    <div className="bg-slate-50 p-4 border-b border-bram-border flex items-center gap-3 z-20">
                        <Database className="text-bram-primary" size={18} />
                        <span className="text-xs font-bold text-bram-text-muted uppercase tracking-wider">Generated Blueprint</span>
                    </div>

                    <div className="p-6 overflow-auto flex-1 font-mono text-[13px] bg-white">
                        {job.status === 'ANALYZING' ? (
                            <div className="absolute inset-0 top-[57px] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                                <div className="flex flex-col items-center text-center px-6">
                                    <div className="w-16 h-16 border-4 border-bram-primary border-t-transparent border-dashed rounded-full animate-spin mb-6"></div>
                                    <p className="text-bram-primary font-bold text-xl mb-2">Ο AI Agent αναλύει το κώδικα...</p>
                                    <p className="text-bram-text-muted text-sm max-w-sm">Σαρώνει το manifest, εντοπίζει dependencies και σχεδιάζει την υποδομή στο {job.targetCloud}.</p>
                                </div>
                            </div>
                        ) : (
                            <pre className="whitespace-pre-wrap text-slate-800">
                            {job.blueprintJson ? JSON.stringify(JSON.parse(job.blueprintJson), null, 2) : "No data generated."}
                        </pre>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AnalyzedRepo;