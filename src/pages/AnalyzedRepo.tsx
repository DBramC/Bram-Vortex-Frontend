import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import {
    Loader2, ArrowLeft, Database, Terminal,
    CheckCircle2, Download, AlertCircle, Play, X
} from 'lucide-react';
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
                if (['COMPLETED', 'FAILED', 'READY_FOR_EXECUTION'].includes(response.data.status)) {
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

    // 2. Download Master ZIP
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
        } catch (error) {
            alert("Package download failed.");
        } finally {
            setIsDownloading(false);
        }
    };

    // 3. Download Comparison ZIP (Draft + Validated)
    const handleDownloadComparison = async () => {
        setIsDownloadingComparison(true);
        try {
            const response = await api.get(`/dashboard/download-comparison/${jobId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `comparison-${jobId}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("Failed to generate comparison package.");
        } finally {
            setIsDownloadingComparison(false);
        }
    };

    // 4. Άνοιγμα Review Modal
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
            alert("Review data not found. Ensure Validator has completed.");
        } finally {
            setIsFetchingDiff(false);
        }
    };

    // 5. Execution Trigger Simulation
    const handleExecuteDeployment = async () => {
        setIsDeploying(true);
        setTimeout(() => {
            alert("🚀 Infrastructure Deployment Triggered!");
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
            <p className="text-white font-black text-xs uppercase tracking-widest animate-pulse">Initializing Environment...</p>
        </div>
    );

    const isReadyForExecution = job.status === 'READY_FOR_EXECUTION' || job.status === 'COMPLETED';

    return (
        <div className="h-screen bg-bram-bg flex flex-col overflow-hidden p-6 lg:p-8 font-sans antialiased text-left relative">

            {/* HEADER */}
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
                            {job.targetCloud} • {job.computeType}
                        </p>
                    </div>
                </div>
                <div className={`px-8 py-2.5 rounded-full font-black text-xs border-2 uppercase tracking-widest
                    ${isReadyForExecution ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-bram-accent border-bram-accent animate-pulse'}`}>
                    {job.status.replace(/_/g, ' ')}
                </div>
            </div>

            {/* TERMINALS */}
            <div className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6 min-h-0">
                <div className="bg-terminal-bg rounded-[2rem] border-2 border-white/10 shadow-2xl flex flex-col overflow-hidden">
                    <div className="bg-slate-800/50 px-6 py-3 border-b border-white/5 flex items-center gap-3">
                        <Terminal size={16} className="text-terminal-prompt" />
                        <span className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Analysis_Prompt</span>
                    </div>
                    <div className="p-7 overflow-auto flex-1 font-mono text-sm text-terminal-prompt scrollbar-hide">
                        <pre className="whitespace-pre-wrap">{job.promptMessage || "> Fetching AI recommendations..."}</pre>
                    </div>
                </div>

                <div className="bg-terminal-bg rounded-[2rem] border-2 border-white/10 shadow-2xl flex flex-col overflow-hidden">
                    <div className="bg-slate-800/50 px-6 py-3 border-b border-white/5 flex items-center gap-3">
                        <Database size={16} className="text-terminal-blueprint" />
                        <span className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Blueprint.json</span>
                    </div>
                    <div className="p-7 overflow-auto flex-1 font-mono text-sm text-terminal-blueprint scrollbar-hide">
                        <pre>{job.blueprintJson ? JSON.stringify(job.blueprintJson, null, 4) : "// Generating..."}</pre>
                    </div>
                </div>
            </div>

            {/* CONTROL PANEL */}
            <div className="w-full max-w-7xl mx-auto bg-white rounded-[2.5rem] border-2 border-bram-border p-6 shadow-xl flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 flex gap-10">
                    {['Terraform', 'Ansible', 'Pipeline', 'Validator'].map((svc) => (
                        <div key={svc} className="flex items-center gap-3">
                            {getMiniStatusIcon((job as any)[`${svc.toLowerCase()}Status`] || (job as any)[`${svc.toLowerCase()}_status`])}
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{svc}</span>
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleDownloadMaster}
                        disabled={!isReadyForExecution || isDownloading}
                        className="flex items-center gap-3 px-6 py-4 rounded-3xl font-black text-xs uppercase bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50 transition-all"
                    >
                        {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                        Master Package
                    </button>

                    <button
                        onClick={handleOpenReview}
                        disabled={!isReadyForExecution || isFetchingDiff}
                        className="flex items-center gap-3 px-8 py-4 rounded-3xl font-black text-xs uppercase bg-bram-primary text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200"
                    >
                        {isFetchingDiff ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                        Review & Deploy
                    </button>
                </div>
            </div>

            {/* MODAL (PRO ARCHITECTURE REVIEW) */}
            {isReviewOpen && diffData.length > 0 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 lg:p-10">
                    <div className="bg-[#0f172a] border border-white/10 w-full max-w-7xl h-full max-h-[90vh] rounded-[3rem] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="px-10 py-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-emerald-500/20 rounded-[1.5rem] border border-emerald-500/20">
                                    <CheckCircle2 className="text-emerald-400" size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Validation Review</h2>
                                    <div className="flex gap-4 mt-2">
                                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest bg-red-400/10 px-3 py-1 rounded-full border border-red-400/20">AI Raw Draft</span>
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">Architect Validated</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsReviewOpen(false)} className="text-slate-500 hover:text-white transition-colors p-3 bg-white/5 rounded-full">
                                <X size={28} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 flex flex-col p-10 min-h-0 bg-[#0f172a]">
                            {/* Tabs */}
                            <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                                {diffData.map((file, index) => (
                                    <button
                                        key={file.filename}
                                        onClick={() => setSelectedFileIndex(index)}
                                        className={`px-6 py-3 rounded-2xl font-black text-[10px] whitespace-nowrap uppercase tracking-[0.15em] transition-all ${
                                            selectedFileIndex === index
                                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-y-[-2px]'
                                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                        }`}
                                    >
                                        {file.filename}
                                    </button>
                                ))}
                            </div>

                            {/* Diff Editor Container with Padding/Margin */}
                            <div className="flex-1 border border-white/5 rounded-[2.5rem] overflow-hidden bg-[#050505] shadow-2xl shadow-black p-8">
                                <DiffEditor
                                    key={selectedFileIndex + diffData[selectedFileIndex].filename}
                                    original={diffData[selectedFileIndex].draftContent}
                                    modified={diffData[selectedFileIndex].validatedContent}
                                    language={diffData[selectedFileIndex].language}
                                    theme="vs-dark"
                                    options={{
                                        readOnly: true,
                                        renderSideBySide: true,
                                        minimap: { enabled: false },
                                        fontSize: 13,
                                        fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,

                                        // --- BREATHING ROOM SETTINGS ---
                                        padding: { top: 30, bottom: 30 },
                                        lineNumbersMinChars: 5,
                                        lineDecorationsWidth: 20,
                                        glyphMargin: false,
                                        folding: true,
                                        wordWrap: "on",

                                        scrollbar: {
                                            vertical: 'hidden',
                                            horizontal: 'hidden',
                                            useShadows: false
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-10 py-8 border-t border-white/5 bg-white/5 flex justify-between items-center">
                            <button
                                onClick={handleDownloadComparison}
                                disabled={isDownloadingComparison}
                                className="flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isDownloadingComparison ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                                Download Comparison ZIP
                            </button>

                            <div className="flex gap-5">
                                <button
                                    onClick={() => setIsReviewOpen(false)}
                                    className="px-10 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleExecuteDeployment}
                                    disabled={isDeploying}
                                    className="px-12 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {isDeploying ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
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