import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Loader2, ArrowLeft, Database, Terminal, CheckCircle2, Download, ShieldCheck, AlertCircle } from 'lucide-react';

interface AnalysisJob {
    jobId: string;
    repoName: string;
    targetCloud: string;
    computeType: string;
    status: string;
    terraformStatus?: string;
    terraform_status?: string;
    ansibleStatus?: string;
    ansible_status?: string;
    pipelineStatus?: string;
    pipeline_status?: string;
    promptMessage: string | null;
    blueprintJson: unknown | null;
}

const AnalyzedRepo: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<AnalysisJob | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // Χρησιμοποιούμε ένα ref για να ξέρουμε πότε να σταματήσουμε το polling
    const stopPolling = useRef(false);

    // 1. Ρωμαλέο Polling: Αντέχει ακόμα και αν το Job δεν βρεθεί αμέσως (404)
    useEffect(() => {
        const fetchJobStatus = async () => {
            if (stopPolling.current) return;

            try {
                const response = await api.get(`/dashboard/jobs/${jobId}`);
                setJob(response.data);

                // Αν φτάσαμε σε τελικό status, σταματάμε τα requests
                const currentStatus = response.data.status;
                if (['COMPLETED', 'FAILED', 'READY_FOR_CHECK'].includes(currentStatus)) {
                    stopPolling.current = true;
                }
            } catch (error) {
                // Αν φάμε 404 στην αρχή, απλά περιμένουμε το επόμενο tick του interval
                console.warn("⏳ Job not found yet, retrying...");
            }
        };

        // Τρέχουμε αμέσως την πρώτη φορά
        fetchJobStatus();

        // Κάθε 3 δευτερόλεπτα
        const intervalId = setInterval(fetchJobStatus, 3000);

        return () => {
            clearInterval(intervalId);
            stopPolling.current = true;
        };
    }, [jobId]); // Μόνο το jobId ως dependency

    // 2. Download Master ZIP - Χρήση του σωστού endpoint
    const handleDownloadMaster = async () => {
        setIsDownloading(true);
        try {
            const response = await api.get(`/dashboard/download/${jobId}`, {
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `vortex-package-${jobId}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download error:", error);
            alert("Το αρχείο δεν είναι έτοιμο στη βάση δεδομένων ακόμα.");
        } finally {
            setIsDownloading(false);
        }
    };

    const getMiniStatusIcon = (rawStatus: string | undefined) => {
        if (!rawStatus) return <Loader2 size={16} className="animate-spin text-bram-primary" />;
        const status = rawStatus.replace(/"/g, '').trim().toUpperCase();

        if (status === 'COMPLETED' || status === 'SKIPPED') {
            return <CheckCircle2 size={16} className="text-emerald-500" />;
        }
        if (status === 'FAILED') {
            return <AlertCircle size={16} className="text-red-500" />;
        }
        return <Loader2 size={16} className="animate-spin text-bram-primary" />;
    };

    // Εμφάνιση Loader αν το Job είναι ακόμα null
    if (!job) return (
        <div className="h-screen bg-bram-bg flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-bram-primary" size={64} />
            <p className="text-white font-black text-xs uppercase tracking-widest animate-pulse">
                Initializing Workspace...
            </p>
        </div>
    );

    const canDownload = job.status === 'READY_FOR_CHECK' || job.status === 'COMPLETED';

    return (
        <div className="h-screen bg-bram-bg flex flex-col overflow-hidden p-6 lg:p-8 font-sans antialiased text-left">

            {/* Header */}
            <div className="w-full max-w-7xl mx-auto mb-8 bg-white p-6 rounded-[2.5rem] border-2 border-bram-border shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/dashboard')} className="p-3 bg-slate-100 rounded-full hover:bg-bram-primary-soft transition-all">
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-bram-text-main tracking-tighter">
                            Analyze: <span className="text-bram-primary">{job.repoName}</span>
                        </h1>
                        <p className="text-bram-text-muted font-black text-[10px] uppercase tracking-[0.2em]">
                            Target: {job.targetCloud} • {job.computeType}
                        </p>
                    </div>
                </div>
                <div className={`px-8 py-2.5 rounded-full font-black text-xs border-2 uppercase tracking-widest
                    ${canDownload ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-bram-accent border-bram-accent animate-pulse'}`}>
                    {job.status.replace(/_/g, ' ')}
                </div>
            </div>

            {/* Terminals */}
            <div className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6 min-h-0">
                <div className="bg-terminal-bg rounded-[2rem] border-2 border-white/10 shadow-2xl flex flex-col overflow-hidden">
                    <div className="bg-slate-800/50 px-6 py-3 border-b border-white/5 flex items-center gap-3">
                        <Terminal size={16} className="text-terminal-prompt" />
                        <span className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Analysis_Logs</span>
                    </div>
                    <div className="p-7 overflow-auto flex-1 font-mono text-sm text-terminal-prompt scrollbar-hide">
                        <pre className="whitespace-pre-wrap">{job.promptMessage || "> Connecting to Gemini AI...\n> Fetching manifest content..."}</pre>
                    </div>
                </div>

                <div className="bg-terminal-bg rounded-[2rem] border-2 border-white/10 shadow-2xl flex flex-col overflow-hidden">
                    <div className="bg-slate-800/50 px-6 py-3 border-b border-white/5 flex items-center gap-3">
                        <Database size={16} className="text-terminal-blueprint" />
                        <span className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Infra_Blueprint.json</span>
                    </div>
                    <div className="p-7 overflow-auto flex-1 font-mono text-sm text-terminal-blueprint scrollbar-hide">
                        <pre>{job.blueprintJson ? JSON.stringify(job.blueprintJson, null, 4) : "// Parsing architecture requirements..."}</pre>
                    </div>
                </div>
            </div>

            {/* Control Panel */}
            <div className="w-full max-w-7xl mx-auto bg-white rounded-[2.5rem] border-2 border-bram-border p-6 shadow-xl flex flex-col md:flex-row items-center gap-8">

                <div className="flex-1 flex gap-10">
                    <div className="flex items-center gap-3">
                        {getMiniStatusIcon(job.terraformStatus || job.terraform_status)}
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Terraform</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {getMiniStatusIcon(job.ansibleStatus || job.ansible_status)}
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Ansible</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {getMiniStatusIcon(job.pipelineStatus || job.pipeline_status)}
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">CI/CD Pipeline</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleDownloadMaster}
                        disabled={!canDownload || isDownloading}
                        className={`flex items-center gap-3 px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-tight transition-all shadow-lg active:scale-95
                            ${canDownload
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                        {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                        {job.status === 'COMPLETED' ? "Download Final Package" : "Download Draft Package"}
                    </button>

                    {job.status === 'READY_FOR_CHECK' && (
                        <button className="flex items-center gap-3 px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-tight bg-bram-primary text-white hover:bg-blue-700 transition-all shadow-lg active:scale-95">
                            <ShieldCheck size={18} />
                            Verify Architecture
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyzedRepo;