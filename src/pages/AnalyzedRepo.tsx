import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Loader2, ArrowLeft, Database, Terminal, HardDrive, Cpu, CheckCircle2 } from 'lucide-react';

interface AnalysisJob {
    jobId: string;
    repoName: string;
    targetCloud: string;
    computeType: string;
    status: 'ANALYZING' | 'COMPLETED' | 'FAILED';
    promptMessage: string | null;
    blueprintJson: never | null;
}

const AnalyzedRepo: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<AnalysisJob | null>(null);

    // Καταστάσεις των Generators (Default: GENERATING)
    const [tfStatus, setTfStatus] = useState<string>('GENERATING');
    const [ansStatus, setAnsStatus] = useState<string>('GENERATING');
    const [isDownloading, setIsDownloading] = useState<string | null>(null);

    // 1. Polling για την κεντρική Ανάλυση
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

    // 2. ΠΟΛΥ ΣΗΜΑΝΤΙΚΟ: Polling για το Status των Terraform & Ansible
    useEffect(() => {
        if (job?.status !== 'COMPLETED') return;

        const checkGeneratorStatuses = async () => {
            try {
                // Έλεγχος Terraform Status
                if (tfStatus !== 'COMPLETED') {
                    const tfRes = await api.get(`/terraform/status/by-analysis/${jobId}`);
                    setTfStatus(tfRes.data);
                }

                // Έλεγχος Ansible Status (μόνο αν είναι VM)
                if ((job.computeType === 'VM' || job.computeType === 'Virtual Machine') && ansStatus !== 'COMPLETED') {
                    const ansRes = await api.get(`/ansible/status/by-analysis/${jobId}`);
                    setAnsStatus(ansRes.data);
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                console.log("Waiting for generators to sync...");
            }
        };

        const interval = setInterval(checkGeneratorStatuses, 3000);
        return () => clearInterval(interval);
    }, [job?.status, jobId, tfStatus, ansStatus, job?.computeType]);

    const handleDownload = async (service: 'terraform' | 'ansible') => {
        setIsDownloading(service);
        try {
            const response = await api.get(`/${service}/download/by-analysis/${jobId}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `vortex-${service}-${jobId?.slice(0, 8)}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            alert("Σφάλμα κατά τη λήψη. Δοκιμάστε ξανά.");
        } finally {
            setIsDownloading(null);
        }
    };

    const safeJsonParse = (data: never) => {
        if (!data) return "// Awaiting JSON stream...";
        if (typeof data === 'object') return JSON.stringify(data, null, 4);

        return String(data);
    };

    if (!job) return (
        <div className="h-screen bg-bram-bg flex items-center justify-center">
            <Loader2 className="animate-spin text-bram-primary" size={64} />
        </div>
    );

    return (
        <div className="h-screen bg-bram-bg flex flex-col overflow-hidden p-6 lg:p-8 font-sans antialiased text-left">

            {/* 1. Header */}
            <div className="w-full max-w-7xl mx-auto mb-8 bg-white p-6 rounded-[2.5rem] border-2 border-bram-border shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/dashboard')} className="p-3 bg-slate-100 rounded-full hover:bg-bram-primary-soft border-2 border-transparent transition-all">
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
                <div className={`px-8 py-2.5 rounded-full font-black text-xs border-2 uppercase tracking-widest shadow-sm
                    ${job.status === 'COMPLETED' ? 'bg-emerald-50 text-bram-primary border-bram-primary' : 'bg-blue-50 text-bram-accent border-bram-accent animate-pulse'}`}>
                    {job.status}
                </div>
            </div>

            {/* 2. Terminals */}
            <div className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6 min-h-0">
                <div className="bg-terminal-bg rounded-[2rem] border-2 border-white/10 shadow-2xl flex flex-col overflow-hidden h-full">
                    <div className="bg-slate-800/50 px-6 py-3 border-b border-white/5 flex items-center gap-3">
                        <Terminal size={16} className="text-terminal-prompt" />
                        <span className="font-black text-[10px] uppercase text-slate-400 font-sans">System_Prompt.log</span>
                    </div>
                    <div className="p-7 overflow-auto flex-1 font-mono text-sm leading-relaxed text-terminal-prompt">
                        <pre className="whitespace-pre-wrap"><span className="opacity-40 mr-2 text-white">$</span>{job.promptMessage || "Handshaking..."}</pre>
                    </div>
                </div>

                <div className="bg-terminal-bg rounded-[2rem] border-2 border-white/10 shadow-2xl flex flex-col overflow-hidden h-full relative">
                    <div className="bg-slate-800/50 px-6 py-3 border-b border-white/5 flex items-center gap-3">
                        <Database size={16} className="text-terminal-blueprint" />
                        <span className="font-black text-[10px] uppercase text-slate-400 font-sans">Infra_Blueprint.json</span>
                    </div>
                    <div className="p-7 overflow-auto flex-1 font-mono text-sm text-terminal-blueprint">
                        {job.status === 'ANALYZING' ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-terminal-bg/90 backdrop-blur-sm z-10">
                                <Loader2 className="animate-spin text-terminal-blueprint mb-6" size={56} />
                                <h3 className="text-terminal-blueprint font-black uppercase font-sans">Compiling...</h3>
                            </div>
                        ) : (
                            <pre className="whitespace-pre-wrap">{safeJsonParse(job.blueprintJson)}</pre>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Downloads: Εδώ χρησιμοποιούμε το tfStatus και ansStatus */}
            {job.status === 'COMPLETED' && (
                <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-4 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Terraform Button */}
                    <button
                        onClick={() => handleDownload('terraform')}
                        disabled={tfStatus !== 'COMPLETED' || isDownloading !== null}
                        className={`flex-1 p-5 rounded-3xl shadow-xl flex items-center justify-between transition-all active:scale-95 border-2 
                            ${tfStatus === 'COMPLETED' ? 'bg-white border-bram-border hover:bg-slate-50' : 'bg-slate-50 border-dashed border-slate-200 opacity-60 cursor-not-allowed'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${tfStatus === 'COMPLETED' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                <HardDrive size={24} />
                            </div>
                            <div>
                                <p className="text-bram-text-main font-black text-sm uppercase tracking-tight">Terraform Package</p>
                                <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1">
                                    {tfStatus === 'COMPLETED' ? 'Artifact Ready' : 'Generating Infrastructure...'}
                                </p>
                            </div>
                        </div>
                        {tfStatus === 'COMPLETED' ? (
                            <CheckCircle2 size={20} className="text-emerald-500" />
                        ) : (
                            <Loader2 className="animate-spin text-blue-600" size={20} />
                        )}
                    </button>

                    {/* Ansible Button */}
                    {(job.computeType === 'VM' || job.computeType === 'Virtual Machine') && (
                        <button
                            onClick={() => handleDownload('ansible')}
                            disabled={ansStatus !== 'COMPLETED' || isDownloading !== null}
                            className={`flex-1 p-5 rounded-3xl shadow-xl flex items-center justify-between transition-all active:scale-95 border-2 
                                ${ansStatus === 'COMPLETED' ? 'bg-white border-bram-border hover:bg-slate-50' : 'bg-slate-50 border-dashed border-slate-200 opacity-60 cursor-not-allowed'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${ansStatus === 'COMPLETED' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <Cpu size={24} />
                                </div>
                                <div>
                                    <p className="text-bram-text-main font-black text-sm uppercase tracking-tight">Ansible Playbooks</p>
                                    <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1">
                                        {ansStatus === 'COMPLETED' ? 'Artifact Ready' : 'Configuring OS Roles...'}
                                    </p>
                                </div>
                            </div>
                            {ansStatus === 'COMPLETED' ? (
                                <CheckCircle2 size={20} className="text-emerald-500" />
                            ) : (
                                <Loader2 className="animate-spin text-purple-600" size={20} />
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnalyzedRepo;