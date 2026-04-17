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
    const [diffData, setDiffData] = useState<DiffFile[]>([]);
    const [isFetchingDiff, setIsFetchingDiff] = useState(false);
    const [selectedFileIndex, setSelectedFileIndex] = useState(0);
    const [isDeploying, setIsDeploying] = useState(false);
    const [isDownloadingComparison, setIsDownloadingComparison] = useState(false);

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

    // 2. Download Master ZIP (Validated)
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
        } catch (error) {
            alert("Package not ready yet.");
        } finally {
            setIsDownloading(false);
        }
    };

    // 3. Download Comparison ZIP (Draft + Validated)
    const handleDownloadComparison = async () => {
        setIsDownloadingComparison(true);
        try {
            const response = await api.get(`/dashboard/download-comparison/${jobId}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `comparison-${jobId}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("Failed to generate comparison zip.");
        } finally {
            setIsDownloadingComparison(false);
        }
    };

    // 4. Φόρτωση δεδομένων για το Diff Review
    const handleOpenReview = async () => {
        setIsFetchingDiff(true);
        try {
            const response = await api.get(`/dashboard/analysis/${jobId}/review`);
            if (response.data && response.data.files) {
                setDiffData(response.data.files);
                setSelectedFileIndex(0);
                setIsReviewOpen(true);
            }
        } catch (error) {
            alert("Failed to load validation review. Ensure the job is COMPLETED.");
        } finally {
            setIsFetchingDiff(false);
        }
    };

    // 5. Προσομοίωση Deployment
    const handleExecuteDeployment = async () => {
        setIsDeploying(true);
        setTimeout(() => {
            alert("🚀 Deployment Process Started! (Execution Service Triggered)");
            setIsDeploying(false);
            setIsReviewOpen(false);
        }, 2000);
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
            <p className="text-white font-black text-xs uppercase tracking-widest animate-pulse">Initializing Workspace...</p>
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
                        <pre className="whitespace-pre-wrap">{job.promptMessage || "> Connecting to Gemini AI..."}</pre>
                    </div>
                </div>

                <div className="bg-terminal-bg rounded-[2rem] border-2 border-white/10 shadow-2xl flex flex-col overflow-hidden">
                    <div className="bg-slate-800/50 px-6 py-3 border-b border-white/5 flex items-center gap-3">
                        <Database size={16} className="text-terminal-blueprint" />
                        <span className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Infra_Blueprint.json</span>
                    </div>
                    <div className="p-7 overflow-auto flex-1 font-mono text-sm text-terminal-blueprint scrollbar-hide">
                        <pre>{job.blueprintJson ? JSON.stringify(job.blueprintJson, null, 4) : "// Parsing..."}</pre>
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
                            ${isReadyForExecution ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                    >
                        {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                        Download Package
                    </button>

                    <button
                        onClick={handleOpenReview}
                        disabled={!isReadyForExecution || isFetchingDiff}
                        className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-tight transition-all shadow-lg active:scale-95
                            ${isReadyForExecution ? 'bg-bram-primary text-white hover:bg-blue-700' : 'bg-blue-100 text-blue-300 cursor-not-allowed'}`}
                    >
                        {isFetchingDiff ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                        Review & Deploy
                    </button>
                </div>
            </div>

            {/* ========================================= */}
            {/* INLINE MODAL (Polished & Pro)            */}
            {/* ========================================= */}
            {isReviewOpen && diffData.length > 0 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 lg:p-10">
                    <div className="bg-[#0f172a] border border-white/10 w-full max-w-7xl h-full max-h-[90vh] rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/20 rounded-2xl">
                                    <CheckCircle2 className="text-emerald-400" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tight uppercase">Architecture Validation</h2>
                                    <div className="flex gap-4 mt-1">
                                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20">AI Draft (Left)</span>
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">Validated (Right)</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsReviewOpen(false)} className="text-slate-500 hover:text-white transition-colors p-2">
                                <X size={28} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 flex flex-col p-8 min-h-0">
                            {/* File Selector Tabs */}
                            <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                                {diffData.map((file, index) => (
                                    <button
                                        key={file.filename}
                                        onClick={() => setSelectedFileIndex(index)}
                                        className={`px-6 py-2.5 rounded-xl font-black text-[10px] whitespace-nowrap uppercase tracking-widest transition-all ${
                                            selectedFileIndex === index
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-y-[-2px]'
                                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                        }`}
                                    >
                                        {file.filename}
                                    </button>
                                ))}
                            </div>

                            {/* Monaco Editor Diff View */}
                            <div className="flex-1 border border-white/5 rounded-[2rem] overflow-hidden bg-[#050505] shadow-inner shadow-black">
                                <DiffEditor
                                    original={diffData[selectedFileIndex].draftContent}
                                    modified={diffData[selectedFileIndex].validatedContent}
                                    language={diffData[selectedFileIndex].language}
                                    theme="vs-dark"
                                    options={{
                                        readOnly: true,
                                        renderSideBySide: true,
                                        minimap: { enabled: false },
                                        fontSize: 13,
                                        fontFamily: "'Fira Code', monospace",
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                        padding: { top: 20, bottom: 20 },
                                        wordWrap: "on"
                                    }}
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-6 border-t border-white/5 bg-white/5 flex justify-between items-center">
                            {/* DOWNLOAD COMPARISON BUTTON */}
                            <button
                                onClick={handleDownloadComparison}
                                disabled={isDownloadingComparison}
                                className="flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isDownloadingComparison ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                                Download Comparison (Zip)
                            </button>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsReviewOpen(false)}
                                    className="px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all active:scale-95"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleExecuteDeployment}
                                    disabled={isDeploying}
                                    className="px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {isDeploying ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                                    Approve & Execute Deploy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyzedRepo;