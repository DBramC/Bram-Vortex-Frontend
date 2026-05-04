import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import {
    Loader2, ArrowLeft, Database, Terminal,
    CheckCircle2, Download, AlertCircle, Play, X,
    Layers, HelpCircle, GitCommit, LayoutDashboard
} from 'lucide-react';
import { DiffEditor } from "@monaco-editor/react";

// --- INTERFACES ---
interface AnalysisJob {
    jobId: string;
    repoName: string;
    repoUrl: string;
    targetCloud: string;
    computeType: string;
    status: string;
    terraformStatus?: string;
    terraform_status?: string;
    ansibleStatus?: string;
    ansible_status?: string;
    pipelineStatus?: string;
    pipeline_status?: string;
    validatorStatus?: string;
    validator_status?: string;
    promptMessage: string | null;
    blueprintJson: Record<string, unknown> | null;
}

interface DiffFile {
    filename: string;
    language: string;
    draftContent: string;
    validatedContent: string;
}

const AnalyzedRepo: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();

    const [job, setJob] = useState<AnalysisJob | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [diffData, setDiffData] = useState<DiffFile[]>([]);
    const [isFetchingDiff, setIsFetchingDiff] = useState(false);
    const [selectedFile, setSelectedFile] = useState<DiffFile | null>(null);
    const [activeCategory] = useState<string>('INFRASTRUCTURE');
    const [, setIsDeploying] = useState(false);

    const stopPolling = useRef(false);

    useEffect(() => {
        const fetchJobStatus = async () => {
            if (stopPolling.current) return;
            try {
                const response = await api.get(`/dashboard/jobs/${jobId}`);
                setJob(response.data);
                const finalStatuses = ['COMPLETED', 'FAILED', 'READY_FOR_EXECUTION', 'EXECUTING'];
                if (finalStatuses.includes(response.data.status)) {
                    // Σταματάμε το polling μόνο αν αποτύχει ή ολοκληρωθεί τελείως
                    stopPolling.current = response.data.status === 'COMPLETED' || response.data.status === 'FAILED';
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                console.warn("⏳ Job status fetch retry...");
            }
        };
        fetchJobStatus();
        const intervalId = setInterval(fetchJobStatus, 3000);
        return () => {
            clearInterval(intervalId);
            stopPolling.current = true;
        };
    }, [jobId]);

    const categories = useMemo(() => {
        const groups: Record<string, DiffFile[]> = {
            'INFRASTRUCTURE': diffData.filter(f => f.filename.includes('INFRASTRUCTURE')),
            'CONFIGURATION': diffData.filter(f => f.filename.includes('CONFIGURATION')),
            'PIPELINE': diffData.filter(f =>
                f.filename.includes('.GITHUB') ||
                f.filename.includes('WORKFLOWS') ||
                f.filename.includes('ROOT') ||
                (!f.filename.includes('INFRASTRUCTURE') && !f.filename.includes('CONFIGURATION'))
            )
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return Object.fromEntries(Object.entries(groups).filter(([_, files]) => files.length > 0));
    }, [diffData]);

    const handleDownloadMaster = async () => {
        setIsDownloading(true);
        try {
            const response = await api.get(`/dashboard/download/${jobId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `vortex-package-${jobId}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) { alert("Download failed."); } finally { setIsDownloading(false); }
    };

    const handleOpenReview = async () => {
        setIsFetchingDiff(true);
        try {
            const response = await api.get(`/dashboard/analysis/${jobId}/review`);
            if (response.data && response.data.files) {
                setDiffData(response.data.files);
                if (response.data.files.length > 0) {
                    setSelectedFile(response.data.files[0]);
                    setIsReviewOpen(true);
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) { alert("Review failed to load."); } finally { setIsFetchingDiff(false); }
    };

    const handleYesCommit = async () => {
        if (!job || !job.repoUrl) {
            console.error("❌ Missing job data or repoUrl");
            return;
        }

        setIsConfirmModalOpen(false);
        setIsDeploying(true);

        try {
            await api.post(`/dashboard/confirm-deployment/${jobId}`, {
                repoUrl: job.repoUrl
            });

            // Ανοίγουμε το GitHub σε νέο tab
            window.open(job.repoUrl, '_blank', 'noopener,noreferrer');

            // Κλείνουμε το modal αλλά παραμένουμε στη σελίδα για να βλέπουμε το status
            setIsReviewOpen(false);
            stopPolling.current = false; // Ξαναξεκινάμε το polling αν είχε σταματήσει

        } catch (error) {
            console.error("❌ Deployment failed:", error);
            alert("Failed to trigger deployment sequence. Please check logs.");
        } finally {
            setIsDeploying(false);
        }
    };

    const handleNoDownload = async () => {
        setIsConfirmModalOpen(false);
        await handleDownloadMaster();
        navigate('/dashboard');
    };

    const getMiniStatusIcon = (rawStatus: string | undefined) => {
        if (!rawStatus) return <Loader2 size={16} className="animate-spin text-bram-primary" />;
        const status = rawStatus.replace(/"/g, '').trim().toUpperCase();
        if (status === 'COMPLETED' || status === 'SKIPPED') return <CheckCircle2 size={16} className="text-emerald-500" />;
        if (status === 'FAILED') return <AlertCircle size={16} className="text-red-500" />;
        return <Loader2 size={16} className="animate-spin text-bram-primary" />;
    };

    if (!job) return (
        <div className="h-screen bg-bram-bg flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-bram-primary" size={64} />
            <p className="text-white font-bold text-sm uppercase tracking-[0.2em] animate-pulse">Initializing Environment...</p>
        </div>
    );

    const serviceStatuses = [
        { name: 'Terraform', status: job.terraformStatus || job.terraform_status },
        { name: 'Ansible', status: job.ansibleStatus || job.ansible_status },
        { name: 'Pipeline', status: job.pipelineStatus || job.pipeline_status },
        { name: 'Validator', status: job.validatorStatus || job.validator_status },
    ];

    const isReadyForExecution = job.status === 'READY_FOR_EXECUTION' || job.status === 'COMPLETED';

    return (
        <div className="h-screen bg-bram-bg flex flex-col overflow-hidden p-10 font-sans antialiased text-left relative">

            {/* HEADER AREA */}
            <div className="w-full max-w-7xl mx-auto mb-10 bg-white p-8 rounded-[2.5rem] border-2 border-bram-border shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-8">
                    <button onClick={() => navigate('/dashboard')} className="p-4 bg-slate-100 rounded-full hover:bg-bram-primary-soft transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-bram-text-main tracking-tight">
                            Analyze: <span className="text-bram-primary">{job.repoName}</span>
                        </h1>
                        <p className="text-bram-text-muted font-bold text-[12px] uppercase tracking-[0.2em] mt-1">
                            {job.targetCloud} • {job.computeType}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Return to Dashboard Button */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[11px] uppercase tracking-[0.15em] text-slate-500 hover:bg-slate-100 border border-slate-200 transition-all"
                    >
                        <LayoutDashboard size={16} /> Portal
                    </button>

                    <div className={`px-10 py-3 rounded-full font-bold text-xs border-2 uppercase tracking-[0.2em]
                        ${isReadyForExecution ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-bram-accent border-bram-accent animate-pulse'}`}>
                        {job.status.replace(/_/g, ' ')}
                    </div>
                </div>
            </div>

            {/* TERMINAL VIEWS */}
            <div className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 min-h-0">
                <div className="bg-[#0f172a] rounded-[2rem] border-2 border-white/10 shadow-2xl flex flex-col overflow-hidden">
                    <div className="bg-slate-800/50 px-8 py-4 border-b border-white/5 flex items-center gap-4">
                        <Terminal size={18} className="text-emerald-400" />
                        <span className="font-bold text-[10px] uppercase text-slate-400 tracking-[0.2em]">Analysis_Logs</span>
                    </div>
                    <div className="p-8 overflow-auto flex-1 font-mono text-sm text-emerald-400 scrollbar-hide">
                        <pre className="whitespace-pre-wrap leading-relaxed">{job.promptMessage || "> AI Analysis logs will appear here..."}</pre>
                    </div>
                </div>
                <div className="bg-[#0f172a] rounded-[2rem] border-2 border-white/10 shadow-2xl flex flex-col overflow-hidden">
                    <div className="bg-slate-800/50 px-8 py-4 border-b border-white/5 flex items-center gap-4">
                        <Database size={18} className="text-blue-400" />
                        <span className="font-bold text-[10px] uppercase text-slate-400 tracking-[0.2em]">Blueprint.json</span>
                    </div>
                    <div className="p-8 overflow-auto flex-1 font-mono text-sm text-blue-400 scrollbar-hide">
                        <pre className="leading-relaxed">{job.blueprintJson ? JSON.stringify(job.blueprintJson, null, 4) : "// Spec JSON..."}</pre>
                    </div>
                </div>
            </div>

            {/* CONTROL PANEL */}
            <div className="w-full max-w-7xl mx-auto bg-white rounded-[2.5rem] border-2 border-bram-border p-8 shadow-xl flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1 flex gap-10">
                    {serviceStatuses.map((svc) => (
                        <div key={svc.name} className="flex items-center gap-3">
                            {getMiniStatusIcon(svc.status)}
                            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-[0.15em]">{svc.name}</span>
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    {/* Secondary Dashboard Exit */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-4 rounded-3xl font-bold text-xs uppercase tracking-[0.1em] bg-white border-2 border-slate-200 text-slate-500 hover:bg-slate-50 transition-all"
                    >
                        Exit to Dashboard
                    </button>

                    <button
                        onClick={handleDownloadMaster}
                        disabled={!isReadyForExecution || isDownloading}
                        className="px-8 py-4 rounded-3xl font-bold text-xs uppercase tracking-[0.15em] bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50 transition-all flex items-center gap-3 shadow-lg"
                    >
                        {isDownloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />} Package
                    </button>

                    <button
                        onClick={handleOpenReview}
                        disabled={!isReadyForExecution || isFetchingDiff}
                        className="px-10 py-4 rounded-3xl font-bold text-xs uppercase tracking-[0.15em] bg-bram-primary text-white hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-3 shadow-lg"
                    >
                        {isFetchingDiff ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />} Review & Deploy
                    </button>
                </div>
            </div>

            {/* MODALS (Review & Confirm) */}
            {isReviewOpen && selectedFile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6 overflow-hidden">
                    <div className="bg-[#0f172a] border border-white/10 w-full h-full max-h-[96vh] rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl">
                        <div className="px-10 py-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-5">
                                <CheckCircle2 className="text-emerald-400" size={28} />
                                <div>
                                    <h2 className="text-xl font-extrabold text-white tracking-tight uppercase">Architecture Validation</h2>
                                    <div className="flex gap-4 mt-1">
                                        <span className="text-[9px] font-bold text-red-400 uppercase tracking-[0.2em] bg-red-400/10 px-3 py-1 rounded-full border border-red-400/10">AI Draft</span>
                                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-[0.2em] bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/10">Validated</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsReviewOpen(false)} className="text-slate-500 hover:text-white p-3 bg-white/5 rounded-full transition-colors"><X size={24} /></button>
                        </div>
                        <div className="flex-1 flex min-h-0">
                            <div className="w-64 border-r border-white/5 bg-black/20 flex flex-col p-6 overflow-y-auto scrollbar-hide">
                                {Object.entries(categories).map(([catName, files]) => (
                                    <div key={catName} className="mb-8">
                                        <div className="flex items-center gap-3 mb-3 px-2 opacity-40">
                                            <Layers size={12} className="text-blue-400" />
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">{catName}</span>
                                        </div>
                                        {files.map(file => (
                                            <button key={file.filename} onClick={() => setSelectedFile(file)} className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] uppercase font-bold mb-1 transition-all ${selectedFile.filename === file.filename ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>
                                                {file.filename.split(': ')[1]}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            <div className="flex-1 flex flex-col p-6">
                                <div className="mb-4 flex justify-between items-end">
                                    <div>
                                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] block">{activeCategory}</span>
                                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">{selectedFile.filename.split(': ')[1]}</h3>
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-500 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 uppercase tracking-widest">Language: {selectedFile.language}</div>
                                </div>
                                <div className="flex-1 border border-white/5 rounded-[2rem] overflow-hidden bg-black p-4 shadow-2xl">
                                    <DiffEditor
                                        original={selectedFile.draftContent}
                                        modified={selectedFile.validatedContent}
                                        language={selectedFile.language}
                                        theme="vs-dark"
                                        options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: "on" }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-10 py-6 border-t border-white/5 bg-white/5 flex justify-end gap-4">
                            <button onClick={() => setIsReviewOpen(false)} className="px-8 py-3 rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:bg-white/10 transition-all">Close Review</button>
                            <button onClick={() => setIsConfirmModalOpen(true)} className="px-10 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg flex items-center gap-3 transition-all">
                                <Play size={18} /> Approve & Deploy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
                    <div className="bg-white border-2 border-slate-200 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-5 bg-blue-50 rounded-full mb-6"><HelpCircle className="text-bram-primary" size={48} /></div>
                            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase mb-2">Final Confirmation</h3>
                            <p className="text-slate-500 text-sm font-medium mb-10 leading-relaxed tracking-normal">
                                Do you want to <span className="font-bold text-slate-900 uppercase underline decoration-emerald-400">commit</span> these validated files to your repository?
                            </p>
                            <div className="w-full flex flex-col gap-3">
                                <button onClick={handleYesCommit} className="w-full py-5 rounded-2xl bg-bram-primary text-white font-bold text-xs uppercase tracking-[0.15em] hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                                    <GitCommit size={18} /> Yes, Commit to my Repo
                                </button>
                                <button onClick={handleNoDownload} className="w-full py-5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-[0.15em] hover:bg-slate-200 transition-all flex items-center justify-center gap-3">
                                    <Download size={18} /> No, Download Locally & Exit
                                </button>
                                <button onClick={() => setIsConfirmModalOpen(false)} className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-all">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyzedRepo;