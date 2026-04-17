import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Loader2, ArrowLeft, Database, Terminal, CheckCircle2, Download, AlertCircle, Play, X } from 'lucide-react';
import { DiffEditor } from "@monaco-editor/react";

// --- INTERFACES ---
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
    validatorStatus?: string;
    validator_status?: string;
    promptMessage: string | null;
    blueprintJson: unknown | null;
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

    // --- STATES ΓΙΑ ΤΟ DIFF REVIEW MODAL ---
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [diffData, setDiffData] = useState<DiffFile[]>([]); // 👈 Διορθωμένος τύπος
    const [isFetchingDiff, setIsFetchingDiff] = useState(false);
    const [selectedFileIndex, setSelectedFileIndex] = useState(0);
    const [isDeploying, setIsDeploying] = useState(false);

    const stopPolling = useRef(false);

    // 1. Polling για την κατάσταση του Job
    useEffect(() => {
        const fetchJobStatus = async () => {
            if (stopPolling.current) return;

            try {
                const response = await api.get(`/dashboard/jobs/${jobId}`);
                setJob(response.data);

                const currentStatus = response.data.status;
                if (['COMPLETED', 'FAILED', 'READY_FOR_EXECUTION'].includes(currentStatus)) {
                    stopPolling.current = true;
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                console.warn("⏳ Job not found yet, retrying...");
            }
        };

        fetchJobStatus();
        const intervalId = setInterval(fetchJobStatus, 3000);

        return () => {
            clearInterval(intervalId);
            stopPolling.current = true;
        };
    }, [jobId]);

    // 2. Download Master ZIP
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

    // 3. Φόρτωση δεδομένων για το Diff Review
    const handleOpenReview = async () => {
        setIsFetchingDiff(true);
        try {
            // 👈 ΔΙΟΡΘΩΣΗ: Προσθήκη του /dashboard στο URL
            const response = await api.get(`/dashboard/analysis/${jobId}/review`);

            if (response.data && response.data.files) {
                setDiffData(response.data.files);
                setSelectedFileIndex(0);
                setIsReviewOpen(true);
            }
        } catch (error) {
            console.error("Failed to fetch diff data:", error);
            alert("Failed to load validation review. Check backend logs.");
        } finally {
            setIsFetchingDiff(false);
        }
    };

    // 4. Προσομοίωση Deployment
    const handleExecuteDeployment = async () => {
        setIsDeploying(true);
        console.log("Triggering deployment for job:", jobId);

        setTimeout(() => {
            alert("🚀 Deployment Process Started! (Simulation)");
            setIsDeploying(false);
            setIsReviewOpen(false);
        }, 2000);
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

    if (!job) return (
        <div className="h-screen bg-bram-bg flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-bram-primary" size={64} />
            <p className="text-white font-black text-xs uppercase tracking-widest animate-pulse">
                Initializing Workspace...
            </p>
        </div>
    );

    const isReadyForExecution = job.status === 'READY_FOR_EXECUTION' || job.status === 'COMPLETED';

    return (
        <div className="h-screen bg-bram-bg flex flex-col overflow-hidden p-6 lg:p-8 font-sans antialiased text-left relative">

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
                    ${isReadyForExecution ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-bram-accent border-bram-accent animate-pulse'}`}>
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
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">CI/CD</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {getMiniStatusIcon(job.validatorStatus || job.validator_status)}
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Validator</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleDownloadMaster}
                        disabled={!isReadyForExecution || isDownloading}
                        className={`flex items-center gap-3 px-6 py-4 rounded-3xl font-black text-xs uppercase tracking-tight transition-all shadow-lg active:scale-95
                            ${isReadyForExecution
                            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                    >
                        {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                        Download Package
                    </button>

                    <button
                        onClick={handleOpenReview}
                        disabled={!isReadyForExecution || isFetchingDiff}
                        className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-tight transition-all shadow-lg active:scale-95
                            ${isReadyForExecution
                            ? 'bg-bram-primary text-white hover:bg-blue-700'
                            : 'bg-blue-100 text-blue-300 cursor-not-allowed'}`}
                    >
                        {isFetchingDiff ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                        Review & Deploy
                    </button>
                </div>
            </div>

            {/* ========================================= */}
            {/* INLINE MODAL (Diff Review Window)        */}
            {/* ========================================= */}
            {isReviewOpen && diffData.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 lg:p-8">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-full max-h-[85vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl">

                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-800 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-black text-green-400 uppercase tracking-tighter">Architecture Review</h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                                    Draft (Left) vs Validated (Right)
                                </p>
                            </div>
                            <button
                                onClick={() => setIsReviewOpen(false)}
                                className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 flex flex-col p-6 min-h-0 bg-slate-900">
                            {/* File Selector Tabs */}
                            <div className="flex gap-2 mb-4">
                                {diffData.map((file, index) => (
                                    <button
                                        key={file.filename}
                                        onClick={() => setSelectedFileIndex(index)}
                                        className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                            selectedFileIndex === index
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                        }`}
                                    >
                                        {file.filename}
                                    </button>
                                ))}
                            </div>

                            {/* Monaco Editor Diff View */}
                            <div className="flex-1 border border-slate-700 rounded-2xl overflow-hidden bg-slate-950">
                                <DiffEditor
                                    original={diffData[selectedFileIndex].draftContent}
                                    modified={diffData[selectedFileIndex].validatedContent}
                                    language={diffData[selectedFileIndex].language}
                                    theme="vs-dark"
                                    options={{
                                        readOnly: true,
                                        renderSideBySide: true,
                                        minimap: { enabled: false },
                                        wordWrap: "on",
                                        scrollBeyondLastLine: false,
                                        fontSize: 12,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-800 flex justify-end gap-4 bg-slate-900/50">
                            <button
                                onClick={() => setIsReviewOpen(false)}
                                disabled={isDeploying}
                                className="px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExecuteDeployment}
                                disabled={isDeploying}
                                className="px-10 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2"
                            >
                                {isDeploying ? <Loader2 className="animate-spin" size={18} /> : null}
                                {isDeploying ? "Deploying..." : "Approve & Execute Deploy"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyzedRepo;