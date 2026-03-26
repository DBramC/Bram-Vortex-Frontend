import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Loader2, ArrowLeft, Database, Terminal, Download, HardDrive, Cpu } from 'lucide-react';

interface AnalysisJob {
    jobId: string;
    repoName: string;
    targetCloud: string;
    computeType: string;
    status: 'ANALYZING' | 'COMPLETED' | 'FAILED';
    promptMessage: string | null;
    blueprintJson: any | null; // <-- Αλλαγή σε any για να δεχτεί είτε string είτε Object
}

const AnalyzedRepo: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<AnalysisJob | null>(null);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);

    // Live Polling
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

    // Download Function
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
        } catch (error) {
            alert("Το αρχείο δεν είναι έτοιμο ακόμα ή προέκυψε σφάλμα.");
        } finally {
            setIsDownloading(null);
        }
    };

    // Η ΟΡΙΣΤΙΚΗ ΔΙΟΡΘΩΣΗ ΓΙΑ ΤΟ JSON PARSING
    const safeJsonParse = (data: any) => {
        if (!data) return "// Awaiting JSON stream...";

        // 1. Αν είναι ήδη Object, απλά κάντο όμορφο string
        if (typeof data === 'object') {
            return JSON.stringify(data, null, 4);
        }

        // 2. Αν είναι String, δοκίμασε να το κάνεις parse πρώτα
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                return JSON.stringify(parsed, null, 4);
            } catch (e) {
                // Αν δεν είναι έγκυρο JSON (π.χ. απλό κείμενο), επίστρεψε το raw κείμενο
                return data;
            }
        }

        return String(data);
    };

    if (!job) return (
        <div className="h-screen bg-bram-bg flex items-center justify-center">
            <Loader2 className="animate-spin text-bram-primary" size={64} />
        </div>
    );

    return (
        <div className="h-screen bg-bram-bg flex flex-col overflow-hidden p-6 lg:p-8 font-sans antialiased">

            {/* 1. Header */}
            <div className="w-full max-w-7xl mx-auto mb-8 bg-white p-6 rounded-[2.5rem] border-2 border-bram-border shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0 text-left">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-3 bg-slate-100 rounded-full hover:bg-bram-primary-soft hover:text-bram-primary transition-all border-2 border-transparent hover:border-bram-primary"
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

                <div className={`px-8 py-2.5 rounded-full font-black text-xs border-2 uppercase tracking-widest shadow-sm
                    ${job.status === 'COMPLETED' ? 'bg-emerald-50 text-bram-primary border-bram-primary' : 'bg-blue-50 text-bram-accent border-bram-accent animate-pulse'}`}>
                    {job.status}
                </div>
            </div>

            {/* 2. Terminals */}
            <div className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6 min-h-0 text-left">

                {/* System Prompt */}
                <div className="bg-terminal-bg rounded-[2rem] border-2 border-white/10 shadow-2xl flex flex-col overflow-hidden h-full">
                    <div className="bg-slate-800/50 px-6 py-3 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Terminal size={16} className="text-terminal-prompt" />
                            <span className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">System_Prompt.log</span>
                        </div>
                    </div>
                    <div className="p-7 overflow-auto flex-1 font-mono text-sm leading-relaxed text-terminal-prompt selection:bg-terminal-prompt/20">
                        <pre className="whitespace-pre-wrap lowercase">
                            <span className="opacity-40 mr-2 text-white">$</span>
                            {job.promptMessage || "Initializing secure AI handshake..."}
                        </pre>
                    </div>
                </div>

                {/* Blueprint JSON */}
                <div className="bg-terminal-bg rounded-[2rem] border-2 border-white/10 shadow-2xl flex flex-col overflow-hidden h-full relative">
                    <div className="bg-slate-800/50 px-6 py-3 border-b border-white/5 flex items-center gap-3">
                        <Database size={16} className="text-terminal-blueprint" />
                        <span className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Infrastructure_Blueprint.json</span>
                    </div>

                    <div className="p-7 overflow-auto flex-1 font-mono text-sm leading-relaxed text-terminal-blueprint selection:bg-terminal-blueprint/20">
                        {job.status === 'ANALYZING' ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 bg-terminal-bg/90 backdrop-blur-sm z-10">
                                <Loader2 className="animate-spin text-terminal-blueprint mb-6" size={56} />
                                <h3 className="text-terminal-blueprint font-black text-xl mb-2 tracking-tighter uppercase">Compiling Blueprint...</h3>
                            </div>
                        ) : (
                            <pre className="whitespace-pre-wrap">
                                {safeJsonParse(job.blueprintJson)}
                            </pre>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Downloads */}
            {job.status === 'COMPLETED' && (
                <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-4 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    <button
                        onClick={() => handleDownload('terraform')}
                        disabled={isDownloading !== null}
                        className="flex-1 bg-white hover:bg-slate-50 border-2 border-bram-border p-5 rounded-3xl shadow-xl flex items-center justify-between group transition-all active:scale-95 text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                                <HardDrive size={24} />
                            </div>
                            <div>
                                <p className="text-bram-text-main font-black text-sm tracking-tight uppercase">Terraform Package</p>
                                <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1">Infrastructure_as_Code.zip</p>
                            </div>
                        </div>
                        {isDownloading === 'terraform' ? <Loader2 className="animate-spin text-blue-600" /> : <Download size={20} className="text-slate-300 group-hover:text-blue-600 transition-colors" />}
                    </button>

                    {(job.computeType === 'VM' || job.computeType === 'Virtual Machine') && (
                        <button
                            onClick={() => handleDownload('ansible')}
                            disabled={isDownloading !== null}
                            className="flex-1 bg-white hover:bg-slate-50 border-2 border-bram-border p-5 rounded-3xl shadow-xl flex items-center justify-between group transition-all active:scale-95 text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                                    <Cpu size={24} />
                                </div>
                                <div>
                                    <p className="text-bram-text-main font-black text-sm tracking-tight uppercase">Ansible Playbooks</p>
                                    <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1">App_Provisioning_Payload.zip</p>
                                </div>
                            </div>
                            {isDownloading === 'ansible' ? <Loader2 className="animate-spin text-purple-600" /> : <Download size={20} className="text-slate-300 group-hover:text-purple-600 transition-colors" />}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnalyzedRepo;