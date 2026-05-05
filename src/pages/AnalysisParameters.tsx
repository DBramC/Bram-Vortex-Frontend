import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Cloud, Globe, Zap, Loader2 } from 'lucide-react';

const AnalysisParameters: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [targetCloud, setTargetCloud] = useState('AWS');
    const [targetRegion, setTargetRegion] = useState('eu-central-1');

    const handleStartAnalysis = async () => {
        setLoading(true);
        try {
            // Στέλνουμε μόνο Cloud και Region. Το AI θα αναλύσει όλα τα Compute Types.
            const response = await api.post('/dashboard/analyze', {
                targetCloud,
                targetRegion,
                repoUrl: localStorage.getItem('selectedRepoUrl'),
                repoName: localStorage.getItem('selectedRepoName')
            });
            navigate(`/dashboard/analysis/${response.data}`);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            alert("Failed to start analysis.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-10 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl">
            <h2 className="text-3xl font-black text-slate-900 mb-8 uppercase tracking-tight">Set Parameters</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* CLOUD PROVIDER */}
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <Cloud size={14} /> Cloud Provider
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {['AWS', 'Azure', 'GCP'].map(cloud => (
                            <button
                                key={cloud}
                                onClick={() => setTargetCloud(cloud)}
                                className={`py-4 rounded-2xl font-bold text-xs transition-all border-2 
                                ${targetCloud === cloud ? 'border-bram-primary bg-blue-50 text-bram-primary' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                            >
                                {cloud}
                            </button>
                        ))}
                    </div>
                </div>

                {/* REGION */}
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <Globe size={14} /> Target Region
                    </label>
                    <input
                        type="text"
                        value={targetRegion}
                        onChange={(e) => setTargetRegion(e.target.value)}
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-sm focus:border-bram-primary outline-none transition-all"
                        placeholder="e.g. us-east-1"
                    />
                </div>
            </div>

            <button
                onClick={handleStartAnalysis}
                disabled={loading}
                className="w-full mt-12 py-5 bg-bram-primary text-white rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
            >
                {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                Initialize AI Blueprinting
            </button>
        </div>
    );
};

export default AnalysisParameters;