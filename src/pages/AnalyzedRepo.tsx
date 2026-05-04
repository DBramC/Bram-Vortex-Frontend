import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import {
    Loader2, ArrowLeft, Database, Terminal,
    CheckCircle2, Download, AlertCircle, Play, X,
    Layers, Settings, GitBranch, FileCode, HelpCircle, GitCommit
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
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // New State
    const [diffData, setDiffData] = useState<DiffFile[]>([]);
    const [isFetchingDiff, setIsFetchingDiff] = useState(false);
    const [selectedFile, setSelectedFile] = useState<DiffFile | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('INFRASTRUCTURE');
    const [isDeploying, setIsDeploying] = useState(false);
    const [isDownloadingComparison, setIsDownloadingComparison] = useState(false);

    const stopPolling = useRef(false);

    useEffect(() => {
        const fetchJobStatus = async () => {
            if (stopPolling.current) return;
            try {
                const response = await api.get(`/dashboard/jobs/${jobId}`);
                setJob(response.data);
                if (['FAILED', 'READY_FOR_EXECUTION', 'EXECUTING'].includes(response.data.status)) {
                    stopPolling.current = response.data.status !== 'EXECUTING';
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) { alert("Failed to generate comparison."); } finally { setIsDownloadingComparison(false); }
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

    // Triggered when user clicks "Approve & Deploy" in Review Modal
    const handleInitiateDeployment = () => {
        setIsConfirmModalOpen(true);
    };

    // Case: NAI (Commit to GitHub)[cite: 5, 6]
    const handleYesCommit = async () => {
        if (!job || !job.repoUrl) return;
        setIsConfirmModalOpen(false);
        setIsDeploying(true);
        try {
            await api.post(`/dashboard/confirm-deployment/${jobId}`, {
                repoUrl: job.repoUrl
            });
            alert("🚀 Deployment sequence initiated!");
            setIsReviewOpen(false);
            stopPolling.current = false;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            alert("Failed to trigger deployment.");
        } finally {
            setIsDeploying(false);
        }
    };

    // Case: OXI (Download & Exit)
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
            <p className="text-white font-black text-xs uppercase tracking-widest animate-pulse">Initializing Environment...</p>
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

            {/* HEADER */}
            <div className="w-full max-w-7xl mx-auto mb-10 bg-white p-8 rounded-[2.5rem] border-2 border-bram-border shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-8">
                    <button onClick={() => navigate('/dashboard')} className="p-4 bg-slate-100 rounded-full hover:bg-bram-primary-soft transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-bram-text-main tracking-tighter">
                            Analyze: <span className="text-bram-primary">{job.repoName}</span>
                        </h1>
                        <p className="text-bram-text-muted font-black text-[11px] uppercase tracking-[0.2em] mt-1">
                            {job.targetCloud} • {job.computeType}
                        </p>
                    </div>
                </div>
                <div className={`px-10 py-3 rounded-full font-black text-xs border-2 uppercase tracking-widest
                    ${isReadyForExecution ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-bram-accent border-bram-accent animate-pulse'}`}>
                    {job.status.replace(/_/g, ' ')}
                </div>
            </div>

            {/* TERMINAL VIEWS */}
            <div className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 min-h-0">
                <div className="bg-terminal-bg rounded-[2rem] border-2 border-white/10 shadow-2xl flex flex-col overflow-hidden">
                    <div className="bg-slate-800/50 px-8 py-4 border-b border-white/5 flex items-center gap-4">
                        <Terminal size={18} className="text-terminal-prompt" />
                        <span className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Analysis_Logs</span>
                    </div>
                    <div className="p-8 overflow-auto flex-1 font-mono text-sm text-terminal-prompt scrollbar-hide">
                        <pre className="whitespace-pre-wrap">{job.promptMessage || "> AI Analysis logs will appear here..."}</pre>
                    </div>
                </div>

                <div className="bg-terminal-bg rounded-[2rem] border-2 border-white/10 shadow-2xl flex flex-col overflow-hidden">
                    <div className="bg-slate-800/50 px-8 py-4 border-b border-white/5 flex items-center gap-4">
                        <Database size={18} className="text-terminal-blueprint" />
                        <span className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Blueprint.json</span>
                    </div>
                    <div className="p-8 overflow-auto flex-1 font-mono text-sm text-terminal-blueprint scrollbar-hide">
                        <pre>{job.blueprintJson ? JSON.stringify(job.blueprintJson, null, 4) : "// Spec JSON..."}</pre>
                    </div>
                </div>
            </div>

            {/* CONTROL PANEL */}
            <div className="w-full max-w-7xl mx-auto bg-white rounded-[2.5rem] border-2 border-bram-border p-8 shadow-xl flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1 flex gap-12">
                    {serviceStatuses.map((svc) => (
                        <div key={svc.name} className="flex items-center gap-3">
                            {getMiniStatusIcon(svc.status)}
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{svc.name}</span>
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleDownloadMaster}
                        disabled={!isReadyForExecution || isDownloading}
                        className="flex items-center gap-4 px-8 py-4 rounded-3xl font-black text-xs uppercase bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50 transition-all shadow-lg"
                    >
                        {isDownloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                        Package
                    </button>

                    <button
                        onClick={handleOpenReview}
                        disabled={!isReadyForExecution || isFetchingDiff}
                        className="flex items-center gap-4 px-10 py-4 rounded-3xl font-black text-xs uppercase bg-bram-primary text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200"
                    >
                        {isFetchingDiff ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
                        Review & Deploy
                    </button>
                </div>
            </div>

            {/* REVIEW MODAL */}
            {isReviewOpen && selectedFile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 lg:p-6 overflow-hidden">
                    <div className="bg-[#0f172a] border border-white/10 w-full max-w-[98vw] h-full max-h-[96vh] rounded-[2.5rem] flex flex-col overflow-hidden shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-300">

                        <div className="px-10 py-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/20 shadow-inner">
                                    <CheckCircle2 className="text-emerald-400" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">Architecture Validation</h2>
                                    <div className="flex gap-4 mt-1">
                                        <span className="text-[8px] font-black text-red-400 uppercase tracking-widest bg-red-400/10 px-3 py-1 rounded-full border border-red-400/10">AI Raw Draft</span>
                                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/10">Architect Validated</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsReviewOpen(false)} className="text-slate-500 hover:text-white transition-all p-3 bg-white/5 hover:bg-white/10 rounded-full">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 flex min-h-0">
                            <div className="w-64 border-r border-white/5 bg-black/20 flex flex-col p-6 overflow-y-auto scrollbar-hide">
                                {Object.entries(categories).map(([catName, files]) => (
                                    <div key={catName} className="mb-8">
                                        <div className="flex items-center gap-3 mb-3 px-2 opacity-40">
                                            {catName === 'INFRASTRUCTURE' && <Layers size={12} className="text-blue-400" />}
                                            {catName === 'CONFIGURATION' && <Settings size={12} className="text-orange-400" />}
                                            {catName === 'PIPELINE' && <GitBranch size={12} className="text-purple-400" />}
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">{catName}</span>
                                        </div>
                                        <div className="space-y-1">
                                            {files.map((file) => {
                                                const isChanged = file.draftContent.trim() !== file.validatedContent.trim();
                                                const isSelected = selectedFile.filename === file.filename;
                                                const cleanName = file.filename.split(': ')[1];
                                                return (
                                                    <button
                                                        key={file.filename}
                                                        onClick={() => { setSelectedFile(file); setActiveCategory(catName); }}
                                                        className={`w-full text-left px-4 py-2.5 rounded-xl transition-all flex items-center justify-between group
                                                            ${isSelected ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <FileCode size={12} className={isSelected ? 'text-blue-200' : 'text-slate-700'} />
                                                            <span className="text-[10px] font-bold truncate uppercase tracking-tight">{cleanName}</span>
                                                        </div>
                                                        {isChanged && <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-sm ${isSelected ? 'bg-white shadow-white' : 'bg-emerald-500 shadow-emerald-500'}`} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex-1 flex flex-col p-6 bg-[#0f172a]">
                                <div className="mb-4 flex justify-between items-end">
                                    <div>
                                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-0.5 block">{activeCategory}</span>
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight">{selectedFile.filename.split(': ')[1]}</h3>
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-500 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 uppercase tracking-widest">
                                        Language: {selectedFile.language}
                                    </div>
                                </div>

                                <div className="flex-1 border border-white/5 rounded-[2rem] overflow-hidden bg-[#050505] shadow-2xl shadow-black p-4">
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
                                            padding: { top: 20, bottom: 20 },
                                            lineNumbersMinChars: 4,
                                            lineDecorationsWidth: 15,
                                            wordWrap: "on",
                                            scrollbar: { vertical: 'hidden', horizontal: 'hidden' }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-10 py-6 border-t border-white/5 bg-white/5 flex justify-between items-center">
                            <button
                                onClick={handleDownloadComparison}
                                disabled={isDownloadingComparison}
                                className="flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isDownloadingComparison ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                                Download Comparison
                            </button>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsReviewOpen(false)}
                                    className="px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all active:scale-95"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleInitiateDeployment}
                                    disabled={isDeploying || job.status === 'EXECUTING'}
                                    className="px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {isDeploying ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                                    Approve & Deploy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* NEW: COMMIT CONFIRMATION MODAL            */}
            {/* ========================================= */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
                    <div className="bg-white border-2 border-slate-200 w-full max-w-lg rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-5 bg-blue-50 rounded-full mb-6">
                                <HelpCircle className="text-bram-primary" size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic mb-2">Final Confirmation</h3>
                            <p className="text-slate-500 text-sm font-medium mb-10 leading-relaxed">
                                Do you want to <span className="font-bold text-slate-900 uppercase italic">commit</span> these validated infrastructure files directly to your GitHub repository?
                            </p>

                            <div className="w-full flex flex-col gap-3">
                                <button
                                    onClick={handleYesCommit}
                                    className="w-full py-5 rounded-2xl bg-bram-primary text-white font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-200"
                                >
                                    <GitCommit size={18} />
                                    Yes, Commit to my Repo
                                </button>
                                <button
                                    onClick={handleNoDownload}
                                    className="w-full py-5 rounded-2xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
                                >
                                    <Download size={18} />
                                    No, Download Locally & Exit
                                </button>
                                <button
                                    onClick={() => setIsConfirmModalOpen(false)}
                                    className="mt-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-all"
                                >
                                    Cancel
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