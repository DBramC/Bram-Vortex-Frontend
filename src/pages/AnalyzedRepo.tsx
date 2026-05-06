import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import {
    Loader2, ArrowLeft, Database, Terminal, Layers, ShieldCheck, CheckCircle2,
    AlertCircle, Download, Play, X, HelpCircle, GitCommit, Cpu, Box, ChevronRight, Sparkles
} from 'lucide-react';
import { DiffEditor } from "@monaco-editor/react";

// --- INTERFACES ---
interface AnalysisJob {
    jobId: string;
    repoName: string;
    repoUrl: string;
    targetCloud: string;
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
    blueprintJson: {
        costEstimates?: Record<string, number>;
        validComputeTypes?: string[];
        [key: string]: unknown;
    } | null;
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

    // States
    const [job, setJob] = useState<AnalysisJob | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [diffData, setDiffData] = useState<DiffFile[]>([]);
    const [isFetchingDiff, setIsFetchingDiff] = useState(false);
    const [selectedFile, setSelectedFile] = useState<DiffFile | null>(null);
    const [isDeploying, setIsDeploying] = useState(false);

    const stopPolling = useRef(false);

    useEffect(() => {
        const fetchJobStatus = async () => {
            if (stopPolling.current) return;
            try {
                const response = await api.get(`/dashboard/jobs/${jobId}`);
                setJob(response.data);
                const finalStatuses = ['COMPLETED', 'FAILED'];
                if (finalStatuses.includes(response.data.status)) {
                    stopPolling.current = true;
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) { console.warn("Polling retry..."); }
        };
        fetchJobStatus();
        const intervalId = setInterval(fetchJobStatus, 3000);
        return () => { clearInterval(intervalId); stopPolling.current = true; };
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

    const handleSelectCompute = async (type: string) => {
        setIsSelecting(true);
        try {
            await api.post(`/dashboard/jobs/${jobId}/select-compute`, { selectedCompute: type });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) { alert("Selection failed."); } finally { setIsSelecting(false); }
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
        if (!job?.repoUrl) return;
        setIsConfirmModalOpen(false);
        setIsDeploying(true);
        try {
            await api.post(`/dashboard/confirm-deployment/${jobId}`, { repoUrl: job.repoUrl });
            window.open(job.repoUrl, '_blank');
            setIsReviewOpen(false);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) { alert("Deployment failed."); } finally { setIsDeploying(false); }
    };

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

    const getMiniStatusIcon = (rawStatus: string | undefined) => {
        if (!rawStatus) return <Loader2 size={16} className="animate-spin text-slate-300" />;
        const status = rawStatus.replace(/"/g, '').trim().toUpperCase();
        if (status === 'COMPLETED' || status === 'SKIPPED') return <CheckCircle2 size={16} className="text-emerald-500" />;
        if (status === 'FAILED') return <AlertCircle size={16} className="text-red-500" />;
        return <Loader2 size={16} className="animate-spin text-bram-primary" />;
    };

    const getComputeIcon = (type: string) => {
        if (type.toLowerCase().includes('machine')) return <Cpu size={32} />;
        if (type.toLowerCase().includes('container')) return <Box size={32} />;
        return <Layers size={32} />;
    };

    if (!job) return <div className="h-screen bg-bram-bg flex items-center justify-center"><Loader2 className="animate-spin text-bram-primary" size={64} /></div>;

    const isPendingSelection = job.status === 'PENDING_USER_SELECTION';
    const isReadyForExecution = job.status === 'READY_FOR_EXECUTION' || job.status === 'COMPLETED';
    const hasCosts = job.blueprintJson && job.blueprintJson.costEstimates && Object.keys(job.blueprintJson.costEstimates).length > 0;

    const serviceStatuses = [
        { name: 'Terraform', status: job.terraformStatus || job.terraform_status },
        { name: 'Ansible', status: job.ansibleStatus || job.ansible_status },
        { name: 'CI/CD', status: job.pipelineStatus || job.pipeline_status },
        { name: 'Validator', status: job.validatorStatus || job.validator_status },
    ];

    return (
        <div className="h-screen bg-bram-bg flex flex-col overflow-hidden p-10 font-sans relative">

            {/* HEADER */}
            <div className="w-full max-w-7xl mx-auto mb-10 bg-white p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-8">
                    <button onClick={() => navigate('/dashboard')} className="p-4 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><ArrowLeft size={24} /></button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Repo: <span className="text-bram-primary">{job.repoName}</span></h1>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">{job.targetCloud} • Analysis</p>
                    </div>
                </div>
                <div className={`px-10 py-3 rounded-full font-bold text-xs uppercase border-2 transition-all duration-500
                    ${isReadyForExecution ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.2)]' :
                    isPendingSelection ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse' :
                        'bg-blue-50 text-bram-primary border-blue-200 animate-pulse'}`}>
                    {job.status.replace(/_/g, ' ')}
                </div>
            </div>

            {/* MAIN AREA */}
            <div className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 min-h-0">

                {/* LOGS PANEL */}
                <div className="bg-[#0f172a] rounded-[2rem] border-2 border-white/10 flex flex-col overflow-hidden shadow-2xl font-mono">
                    <div className="bg-slate-800/50 px-8 py-4 border-b border-white/5 flex items-center gap-4 text-emerald-400">
                        <Terminal size={18} /> <span className="text-[10px] uppercase font-bold tracking-widest">Live_Orchestration_Logs</span>
                    </div>
                    <div className="p-8 overflow-auto flex-1 text-sm text-emerald-400 scrollbar-hide">
                        <pre className="whitespace-pre-wrap leading-relaxed">{job.promptMessage || "> Connecting to Vortex AI engines..."}</pre>
                        {isReadyForExecution && <div className="mt-4 text-emerald-300 font-black animate-bounce tracking-widest">🏆 [ORCHESTRATOR] VALIDATOR COMPLETED SUCCESSFULLY!</div>}
                    </div>
                </div>

                {/* INTERACTIVE PANEL / BLUEPRINT */}
                <div className="bg-[#0f172a] rounded-[2rem] border-2 border-white/10 flex flex-col overflow-hidden relative shadow-2xl">

                    {/* CASE 1: PENDING USER SELECTION (COSTS OVERLAY) */}
                    {isPendingSelection && (
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl z-20 p-10 flex flex-col items-center justify-center animate-in fade-in duration-500">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Select Architecture</h2>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-10 text-center">
                                {hasCosts ? "AI analysis complete. Choose your deployment path based on monthly cost." : "Analyzing infrastructure costs..."}
                            </p>

                            <div className="grid grid-cols-1 gap-4 w-full max-w-md">
                                {hasCosts ? (
                                    Object.entries(job.blueprintJson!.costEstimates!).map(([type, price]) => (
                                        <button key={type} disabled={isSelecting} onClick={() => handleSelectCompute(type)}
                                                className="group bg-white/5 border-2 border-white/5 p-6 rounded-3xl flex items-center justify-between hover:border-bram-primary hover:bg-bram-primary/10 transition-all duration-300">
                                            <div className="flex items-center gap-5">
                                                <div className="text-slate-400 group-hover:text-bram-primary transition-colors">{getComputeIcon(type)}</div>
                                                <div className="text-left">
                                                    <span className="block text-white font-black text-xs uppercase tracking-widest">{type}</span>
                                                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Estimated Monthly</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-emerald-400 font-mono font-black text-xl">${price.toFixed(2)}</span>
                                                <ChevronRight className="text-slate-800 group-hover:text-white transition-colors" size={18} />
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    /* SKELETON LOADERS FOR COSTS */
                                    [1, 2, 3].map((i) => (
                                        <div key={i} className="w-full h-24 bg-white/5 rounded-3xl border-2 border-white/5 p-6 flex items-center justify-between animate-pulse">
                                            <div className="flex items-center gap-5">
                                                <div className="w-10 h-10 bg-slate-700 rounded-lg"></div>
                                                <div className="space-y-2">
                                                    <div className="w-24 h-2 bg-slate-700 rounded"></div>
                                                    <div className="w-16 h-2 bg-slate-800 rounded"></div>
                                                </div>
                                            </div>
                                            <div className="w-16 h-6 bg-emerald-900/30 rounded"></div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* CASE 2: SUCCESS OVERLAY */}
                    {isReadyForExecution && (
                        <div className="absolute inset-0 bg-emerald-600/10 backdrop-blur-2xl z-30 p-12 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
                            <div className="bg-emerald-500 p-6 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.5)] mb-8">
                                <ShieldCheck size={64} className="text-white" />
                            </div>
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Synthesis Validated</h2>
                            <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-[0.3em] mb-12 max-w-sm leading-relaxed">
                                Infrastructure and pipelines verified. System is ready for delivery.
                            </p>
                        </div>
                    )}

                    {/* BLUEPRINT VIEW (HEADER & CONTENT) */}
                    <div className="bg-slate-800/50 px-8 py-4 border-b border-white/5 flex items-center justify-between font-mono">
                        <div className="flex items-center gap-4 text-blue-400">
                            <Database size={18} /> <span className="text-[10px] uppercase font-bold tracking-widest">Blueprint_Spec</span>
                        </div>
                        {!job.blueprintJson && (
                            <div className="flex items-center gap-2 text-blue-400">
                                <Sparkles size={14} className="animate-pulse" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">AI Modeling...</span>
                            </div>
                        )}
                    </div>
                    <div className="p-8 overflow-auto flex-1 font-mono text-sm text-blue-400 scrollbar-hide">
                        {job.blueprintJson ? (
                            <pre className="animate-in fade-in duration-700">{JSON.stringify(job.blueprintJson, null, 4)}</pre>
                        ) : (
                            <div className="space-y-4 animate-pulse pt-4">
                                <div className="h-4 bg-blue-900/20 rounded w-3/4"></div>
                                <div className="h-4 bg-blue-900/20 rounded w-1/2"></div>
                                <div className="h-4 bg-blue-900/20 rounded w-5/6"></div>
                                <div className="h-4 bg-blue-900/20 rounded w-2/3"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BOTTOM CONTROL PANEL */}
            <div className="w-full max-w-7xl mx-auto bg-white rounded-[2.5rem] border-2 border-slate-100 p-6 shadow-2xl flex flex-col md:flex-row items-center gap-10 transition-all">
                {/* Status List */}
                <div className="flex-1 flex gap-10 items-center overflow-x-auto scrollbar-hide px-4">
                    {serviceStatuses.map((svc) => (
                        <div key={svc.name} className="flex items-center gap-3 whitespace-nowrap">
                            {getMiniStatusIcon(svc.status)}
                            <span className="text-[11px] font-black uppercase text-slate-500 tracking-[0.15em]">{svc.name}</span>
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={handleDownloadMaster}
                        disabled={!isReadyForExecution || isDownloading}
                        className="px-8 py-4 rounded-3xl font-bold text-[11px] uppercase tracking-[0.15em] bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition-all flex items-center gap-3 shadow-sm active:scale-95"
                    >
                        {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} Package
                    </button>

                    <button
                        onClick={handleOpenReview}
                        disabled={!isReadyForExecution || isFetchingDiff}
                        className="px-10 py-4 rounded-3xl font-bold text-[11px] uppercase tracking-[0.15em] bg-[#2563eb] text-white hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-3 shadow-lg shadow-blue-100 active:scale-95"
                    >
                        {isFetchingDiff ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />} Review & Deploy
                    </button>
                </div>
            </div>

            {/* --- MODAL: DIFF REVIEW --- */}
            {isReviewOpen && selectedFile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6 overflow-hidden">
                    <div className="bg-[#0f172a] border border-white/10 w-full h-full max-h-[96vh] rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl">
                        <div className="px-10 py-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-5 text-white">
                                <CheckCircle2 className="text-emerald-400" size={28} />
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight">Validated Architecture Review</h2>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Review AI-Generated assets before pushing to Production</p>
                                </div>
                            </div>
                            <button onClick={() => setIsReviewOpen(false)} className="text-slate-500 hover:text-white p-3 bg-white/5 rounded-full transition-colors"><X size={24} /></button>
                        </div>
                        <div className="flex-1 flex min-h-0">
                            {/* File Sidebar */}
                            <div className="w-64 border-r border-white/5 bg-black/20 flex flex-col p-6 overflow-y-auto scrollbar-hide">
                                {Object.entries(categories).map(([catName, files]) => (
                                    <div key={catName} className="mb-8">
                                        <div className="flex items-center gap-3 mb-3 px-2 opacity-40 text-white">
                                            <Layers size={12} className="text-blue-400" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{catName}</span>
                                        </div>
                                        {files.map(file => (
                                            <button key={file.filename} onClick={() => setSelectedFile(file)} className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] uppercase font-bold mb-1 transition-all ${selectedFile.filename === file.filename ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>
                                                {file.filename.split(': ')[1] || file.filename}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            {/* Editor View */}
                            <div className="flex-1 flex flex-col p-6 overflow-hidden">
                                <div className="mb-4 flex justify-between items-end">
                                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">{selectedFile.filename}</h3>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">Language: {selectedFile.language}</div>
                                </div>
                                <div className="flex-1 border border-white/5 rounded-[2rem] overflow-hidden bg-black p-4 shadow-2xl">
                                    <DiffEditor
                                        original={selectedFile.draftContent}
                                        modified={selectedFile.validatedContent}
                                        language={selectedFile.language}
                                        theme="vs-dark"
                                        options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: "on", renderSideBySide: true }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-10 py-6 border-t border-white/5 bg-white/5 flex justify-end gap-4">
                            <button onClick={() => setIsReviewOpen(false)} className="px-8 py-3 font-bold text-[11px] uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Cancel</button>
                            <button onClick={() => setIsConfirmModalOpen(true)} className="px-10 py-4 rounded-2xl font-bold text-[11px] uppercase bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-3 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                                <GitCommit size={18} /> Approve & Commit to Repo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL: COMMIT CONFIRMATION --- */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
                    <div className="bg-white border-2 border-slate-200 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-5 bg-blue-50 rounded-full mb-6 text-blue-600"><HelpCircle size={48} /></div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Final Confirmation</h3>
                            <p className="text-slate-500 text-sm font-medium mb-10 leading-relaxed">
                                Deploy synthesis to <strong>{job.repoName}</strong>? This action will push a new branch with the generated infrastructure to your GitHub repository.
                            </p>
                            <div className="w-full flex flex-col gap-3">
                                <button onClick={handleYesCommit} disabled={isDeploying} className="w-full py-5 rounded-2xl bg-[#2563eb] text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg active:scale-95">
                                    {isDeploying ? <Loader2 className="animate-spin" /> : <GitCommit size={18} />} Yes, Push Changes
                                </button>
                                <button onClick={() => setIsConfirmModalOpen(false)} className="w-full py-5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyzedRepo;