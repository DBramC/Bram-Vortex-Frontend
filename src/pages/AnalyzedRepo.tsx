import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import {
    Loader2, ArrowLeft, Database, Terminal,
    CheckCircle2, Download, AlertCircle, Play, X,
    Layers, Settings, GitBranch, FileCode
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
    const [selectedFile, setSelectedFile] = useState<DiffFile | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('INFRASTRUCTURE');
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

    // 2. Ομαδοποίηση αρχείων ανά Κατηγορία
    const categories = useMemo(() => {
        const groups: Record<string, DiffFile[]> = {
            'INFRASTRUCTURE': diffData.filter(f => f.filename.includes('INFRASTRUCTURE')),
            'CONFIGURATION': diffData.filter(f => f.filename.includes('CONFIGURATION')),
            'PIPELINE': diffData.filter(f => f.filename.includes('ROOT') || f.filename.toLowerCase().includes('pipeline'))
        };
        // Αφαιρούμε άδειες κατηγορίες (π.χ. Configuration αν δεν είναι VM)
        return Object.fromEntries(Object.entries(groups).filter(([_, files]) => files.length > 0));
    }, [diffData]);

    // 3. Download Logic
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
        } catch (error) { alert("Download failed."); } finally { setIsDownloading(false); }
    };

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
        } catch (error) { alert("Failed to generate comparison."); } finally { setIsDownloadingComparison(false); }
    };

    // 4. Modal Open
    const handleOpenReview = async () => {
        setIsFetchingDiff(true);
        try {
            const response = await api.get(`/dashboard/analysis/${jobId}/review`);
            if (response.data && response.data.files) {
                const files = response.data.files;
                setDiffData(files);
                // Προεπιλογή πρώτου αρχείου
                if (files.length > 0) {
                    setSelectedFile(files[0]);
                    const firstCat = files[0].filename.split(':')[0];
                    setActiveCategory(firstCat);
                }
                setIsReviewOpen(true);
            }
        } catch (error) { alert("Review failed to load."); } finally { setIsFetchingDiff(false); }
    };

    const handleExecuteDeployment = async () => {
        setIsDeploying(true);
        setTimeout(() => {
            alert("🚀 Deployment Process Started!");
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
                        <span className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Analysis_Logs</span>
                    </div>
                    <div className="p-7 overflow-auto flex-1 font-mono text-sm text-terminal-prompt scrollbar-hide">
                        <pre className="whitespace-pre-wrap">{job.promptMessage || "> AI Analysis in progress..."}</pre>
                    </div>
                </div>

                <div className="bg-terminal-bg rounded-[2rem] border-2 border-white/10 shadow-2xl flex flex-col overflow-hidden">
                    <div className="bg-slate-800/50 px-6 py-3 border-b border-white/5 flex items-center gap-3">
                        <Database size={16} className="text-terminal-blueprint" />
                        <span className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Blueprint.json</span>
                    </div>
                    <div className="p-7 overflow-auto flex-1 font-mono text-sm text-terminal-blueprint scrollbar-hide">
                        <pre>{job.blueprintJson ? JSON.stringify(job.blueprintJson, null, 4) : "// Parsing specs..."}</pre>
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
                        Package
                    </button>

                    <button
                        onClick={handleOpenReview}
                        disabled={!isReadyForExecution || isFetchingDiff}
                        className="flex items-center gap-3 px-8 py-4 rounded-3xl font-black text-xs uppercase bg-bram-primary text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg"
                    >
                        {isFetchingDiff ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                        Review & Deploy
                    </button>
                </div>
            </div>

            {/* ========================================= */}
            {/* PRO MODAL (CATEGORIZED DIFF REVIEW)       */}
            {/* ========================================= */}
            {isReviewOpen && selectedFile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 lg:p-10 overflow-hidden">
                    <div className="bg-[#0f172a] border border-white/10 w-full max-w-[95vw] h-full max-h-[92vh] rounded-[3.5rem] flex flex-col overflow-hidden shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-300">

                        {/* Modal Header */}
                        <div className="px-12 py-10 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="p-5 bg-emerald-500/20 rounded-3xl border border-emerald-500/20 shadow-inner">
                                    <CheckCircle2 className="text-emerald-400" size={32} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Architecture Validation</h2>
                                    <div className="flex gap-4 mt-2">
                                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest bg-red-400/10 px-4 py-1.5 rounded-full border border-red-400/10 shadow-sm">AI Raw Draft</span>
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-4 py-1.5 rounded-full border border-emerald-400/10 shadow-sm">Architect Validated</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsReviewOpen(false)} className="text-slate-500 hover:text-white transition-all p-4 bg-white/5 hover:bg-white/10 rounded-full">
                                <X size={32} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 flex min-h-0">

                            {/* Left Sidebar: Categories & Files */}
                            <div className="w-80 border-r border-white/5 bg-black/20 flex flex-col p-8 overflow-y-auto scrollbar-hide">
                                {Object.entries(categories).map(([catName, files]) => (
                                    <div key={catName} className="mb-10">
                                        <div className="flex items-center gap-3 mb-4 px-2 opacity-50">
                                            {catName === 'INFRASTRUCTURE' && <Layers size={14} className="text-blue-400" />}
                                            {catName === 'CONFIGURATION' && <Settings size={14} className="text-orange-400" />}
                                            {catName === 'PIPELINE' && <GitBranch size={14} className="text-purple-400" />}
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{catName}</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {files.map((file) => {
                                                const isChanged = file.draftContent.trim() !== file.validatedContent.trim();
                                                const isSelected = selectedFile.filename === file.filename;
                                                const cleanName = file.filename.split(': ')[1];

                                                return (
                                                    <button
                                                        key={file.filename}
                                                        onClick={() => { setSelectedFile(file); setActiveCategory(catName); }}
                                                        className={`w-full text-left px-5 py-3.5 rounded-2xl transition-all flex items-center justify-between group
                                                            ${isSelected ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'text-slate-400 hover:bg-white/5'}`}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <FileCode size={14} className={isSelected ? 'text-blue-200' : 'text-slate-600'} />
                                                            <span className="text-[11px] font-bold truncate uppercase tracking-tight">{cleanName}</span>
                                                        </div>
                                                        {isChanged && (
                                                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px] 
                                                                ${isSelected ? 'bg-white shadow-white' : 'bg-emerald-500 shadow-emerald-500'}`}
                                                            />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Main: Diff Editor */}
                            <div className="flex-1 flex flex-col p-10 bg-[#0f172a]">
                                <div className="mb-6 flex justify-between items-end">
                                    <div>
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 block">{activeCategory}</span>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">{selectedFile.filename.split(': ')[1]}</h3>
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-500 bg-white/5 px-4 py-2 rounded-xl border border-white/5 uppercase tracking-widest">
                                        Language: {selectedFile.language}
                                    </div>
                                </div>

                                <div className="flex-1 border border-white/5 rounded-[3rem] overflow-hidden bg-[#050505] shadow-2xl shadow-black p-10">
                                    <DiffEditor
                                        key={selectedFile.filename}
                                        original={selectedFile.draftContent}
                                        modified={selectedFile.validatedContent}
                                        language={selectedFile.language}
                                        theme="vs-dark"
                                        options={{
                                            readOnly: true,
                                            renderSideBySide: true,
                                            minimap: { enabled: false },
                                            fontSize: 13,
                                            fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                            padding: { top: 35, bottom: 35 },
                                            lineNumbersMinChars: 5,
                                            lineDecorationsWidth: 25,
                                            glyphMargin: false,
                                            wordWrap: "on",
                                            scrollbar: { vertical: 'hidden', horizontal: 'hidden' }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-12 py-10 border-t border-white/5 bg-white/5 flex justify-between items-center">
                            <button
                                onClick={handleDownloadComparison}
                                disabled={isDownloadingComparison}
                                className="flex items-center gap-4 px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isDownloadingComparison ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                                Download Comparison ZIP
                            </button>

                            <div className="flex gap-6">
                                <button
                                    onClick={() => setIsReviewOpen(false)}
                                    className="px-12 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all active:scale-95 border border-transparent hover:border-white/10"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleExecuteDeployment}
                                    disabled={isDeploying}
                                    className="px-14 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-widest bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_20px_50px_-15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-4 active:scale-95 disabled:opacity-50"
                                >
                                    {isDeploying ? <Loader2 className="animate-spin" size={22} /> : <Play size={22} />}
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