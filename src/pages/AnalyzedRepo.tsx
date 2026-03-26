import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Loader2, ArrowLeft, Database, Terminal, Download, HardDrive, Cpu, AlertTriangle } from 'lucide-react';

interface AnalysisJob {
    jobId: string;
    repoName: string;
    targetCloud: string;
    computeType: string;
    status: 'ANALYZING' | 'COMPLETED' | 'FAILED';
    promptMessage: string | null;
    blueprintJson: string | null;
}

const AnalyzedRepo: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<AnalysisJob | null>(null);
    const [error, setError] = useState<string | null>(null); // Για να βλέπουμε αν έσκασε το API
    const [isDownloading, setIsDownloading] = useState<string | null>(null);

    useEffect(() => {
        const fetchJobStatus = async () => {
            try {
                const response = await api.get(`/dashboard/jobs/${jobId}`);
                setJob(response.data);
                setError(null);
            } catch (error: any) {
                console.error("API Error:", error);
                setError(error.response?.data?.message || "Failed to fetch job status. Check Backend logs.");
            }
        };

        fetchJobStatus();
        const interval = setInterval(() => {
            if (job?.status !== 'COMPLETED' && job?.status !== 'FAILED') fetchJobStatus();
        }, 3000);
        return () => clearInterval(interval);
    }, [jobId, job?.status]);

    const handleDownload = async (service: 'terraform' | 'ansible') => {
        setIsDownloading(service);
        try {
            const response = await api.get(`/${service}/download/by-analysis/${jobId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `vortex-${service}-${jobId?.slice(0, 8)}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            alert("Artifact not ready yet.");
        } finally {
            setIsDownloading(null);
        }
    };

    // 1. Error State
    if (error) return (
        <div className="h-screen bg-bram-bg flex flex-col items-center justify-center text-red-500 p-10 font-mono text-center">
            <AlertTriangle size={64} className="mb-4" />
            <h2 className="text-2xl font-black uppercase mb-2">System_Critical_Error</h2>
            <p className="max-w-md opacity-70">{error}</p>
            <button onClick={() => navigate('/dashboard')} className="mt-8 border border-red-500 px-6 py-2 rounded-full hover:bg-red-500 hover:text-white transition-all">RETURN_TO_BASE</button>
        </div>
    );

    // 2. Loading State (Βεβαιώσου ότι το bg-bram-bg και text-bram-primary υπάρχουν στο tailwind config)
    if (!job) return (
        <div className="h-screen bg-[#050505] flex flex-col items-center justify-center text-emerald-500 font-mono">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="text-[10px] tracking-[0.5em] uppercase animate-pulse">Establishing_Secure_Link...</p>
        </div>
    );

    // Safe JSON Parsing για να μην κρασάρει η σελίδα
    const renderBlueprint = () => {
        if (!job.blueprintJson) return "// Awaiting data stream...";
        try {
            return JSON.stringify(JSON.parse(job.blueprintJson), null, 4);
        } catch (e) {
            return job.blueprintJson; // Αν δεν είναι ακόμα έγκυρο JSON, δείξε το raw string
        }
    };

    return (
        <div className="h-screen bg-[#050505] flex flex-col overflow-hidden p-4 lg:p-8 font-sans antialiased">
            {/* Header */}
            <div className="w-full max-w-7xl mx-auto mb-6 bg-[#0a0a0a] border border-emerald-500/20 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/dashboard')} className="p-3 bg-white/5 rounded-full text-emerald-500 hover:bg-emerald-500/20 transition-all border border-emerald-500/20">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="text-left">
                        <h1 className="text-2xl font-black text-white tracking-tighter">
                            PROJECT: <span className="text-emerald-500">{job.repoName}</span>
                        </h1>
                        <p className="text-emerald-500/40 font-mono text-[9px] uppercase tracking-[0.3em] mt-1 italic">
                            Status_Report // {job.targetCloud} // {job.jobId.slice(0, 8)}
                        </p>
                    </div>
                </div>
                <div className={`px-6 py-1.5 rounded-full font-mono text-[10px] border uppercase tracking-[0.3em]
                    ${job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50' : 'bg-blue-500/10 text-blue-400 border-blue-400/50 animate-pulse'}`}>
                    {job.status}
                </div>
            </div>

            {/* Terminals */}
            <div className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 min-h-0">
                {/* System Prompt */}
                <div className="bg-[#080808] rounded-[1.5rem] border border-white/5 shadow-2xl flex flex-col overflow-hidden">
                    <div className="bg-white/5 px-5 py-2 border-b border-white/5 flex items-center gap-3">
                        <Terminal size={14} className="text-emerald-500" />
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">system.log</span>
                    </div>
                    <div className="p-6 overflow-auto flex-1 font-mono text-[13px] leading-relaxed text-emerald-500/80 text-left">
                        <pre className="whitespace-pre-wrap"><span className="text-emerald-500 mr-2">$</span>{job.promptMessage || "Waiting for handshake..."}</pre>
                    </div>
                </div>

                {/* Blueprint */}
                <div className="bg-[#080808] rounded-[1.5rem] border border-white/5 shadow-2xl flex flex-col overflow-hidden relative">
                    <div className="bg-white/5 px-5 py-2 border-b border-white/5 flex items-center gap-3">
                        <Database size={14} className="text-blue-400" />
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">infra_blueprint.json</span>
                    </div>
                    <div className="p-6 overflow-auto flex-1 font-mono text-[13px] leading-relaxed text-blue-400/80 text-left">
                        {job.status === 'ANALYZING' && (
                            <div className="absolute inset-0 bg-[#080808]/90 flex flex-col items-center justify-center z-20">
                                <Loader2 className="animate-spin text-blue-400 mb-4" size={40} />
                                <span className="text-[9px] text-blue-400/60 uppercase tracking-[0.5em]">Compiling_Architectures...</span>
                            </div>
                        )}
                        <pre className="whitespace-pre-wrap">{renderBlueprint()}</pre>
                    </div>
                </div>
            </div>

            {/* Downloads */}
            {job.status === 'COMPLETED' && (
                <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-4 mb-4 flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <button onClick={() => handleDownload('terraform')} disabled={isDownloading !== null} className="flex-1 bg-[#0a0a0a] border border-blue-500/20 hover:border-blue-500 p-5 rounded-2xl flex items-center justify-between group transition-all">
                        <div className="flex items-center gap-4 text-left">
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl group-hover:scale-110 transition-transform"><HardDrive size={22} /></div>
                            <div>
                                <p className="text-white font-black text-xs uppercase tracking-tighter">Terraform_Package</p>
                                <p className="text-blue-500/40 font-mono text-[8px] uppercase tracking-widest mt-1">IaC_Stream_Ready</p>
                            </div>
                        </div>
                        {isDownloading === 'terraform' ? <Loader2 className="animate-spin text-blue-500" /> : <Download size={18} className="text-blue-500/30 group-hover:text-blue-500 transition-colors" />}
                    </button>

                    {(job.computeType === 'VM' || job.computeType === 'Virtual Machine') && (
                        <button onClick={() => handleDownload('ansible')} disabled={isDownloading !== null} className="flex-1 bg-[#0a0a0a] border border-emerald-500/20 hover:border-emerald-500 p-5 rounded-2xl flex items-center justify-between group transition-all">
                            <div className="flex items-center gap-4 text-left">
                                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform"><Cpu size={22} /></div>
                                <div>
                                    <p className="text-white font-black text-xs uppercase tracking-tighter">Ansible_Playbooks</p>
                                    <p className="text-emerald-500/40 font-mono text-[8px] uppercase tracking-widest mt-1">Config_Payload_Ready</p>
                                </div>
                            </div>
                            {isDownloading === 'ansible' ? <Loader2 className="animate-spin text-emerald-500" /> : <Download size={18} className="text-emerald-500/30 group-hover:text-emerald-500 transition-colors" />}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnalyzedRepo;