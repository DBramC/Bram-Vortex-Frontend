import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from "../api/axiosInstance"; // Το δικό σου axios instance

interface AnalysisJob {
    jobId: string;
    repoName: string;
    targetCloud: string;
    status: 'ANALYZING' | 'COMPLETED' | 'FAILED';
    promptMessage: string | null;
    blueprintJson: string | null;
}

const AnalyzedRepo: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const [job, setJob] = useState<AnalysisJob | null>(null);

    useEffect(() => {
        // Συνάρτηση που ρωτάει τον server για την κατάσταση
        const fetchJobStatus = async () => {
            try {
                // Προσάρμοσε το URL στο πραγματικό σου endpoint
                const response = await api.get(`/dashboard/jobs/${jobId}`);
                setJob(response.data);
            } catch (error) {
                console.error("Error fetching job status", error);
            }
        };

        fetchJobStatus(); // Αρχική κλήση

        // Polling κάθε 2 δευτερόλεπτα ΑΝ δεν έχει τελειώσει
        const interval = setInterval(() => {
            if (job?.status !== 'COMPLETED' && job?.status !== 'FAILED') {
                fetchJobStatus();
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [jobId, job?.status]);

    if (!job) {
        return <div className="p-10 text-center text-white">Loading data from Vault...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-950 p-8 text-gray-200 font-sans">

            {/* Header Σελίδας */}
            <div className="mb-6 flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">AI Analysis: {job.repoName}</h1>
                    <p className="text-gray-400">Target Cloud: {job.targetCloud} | Job ID: {job.jobId}</p>
                </div>

                {/* Live Status Badge */}
                <div className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 
          ${job.status === 'ANALYZING' ? 'bg-blue-900/50 text-blue-400 border border-blue-500' : ''}
          ${job.status === 'COMPLETED' ? 'bg-green-900/50 text-green-400 border border-green-500' : ''}
          ${job.status === 'FAILED' ? 'bg-red-900/50 text-red-400 border border-red-500' : ''}`}>

                    {job.status === 'ANALYZING' && (
                        <span className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></span>
                    )}
                    {job.status}
                </div>
            </div>

            {/* Split Screen Container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ΑΡΙΣΤΕΡΑ: Το Prompt που στείλαμε */}
                <div className="flex flex-col h-[700px] bg-gray-900 rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
                    <div className="bg-gray-800 p-3 border-b border-gray-700 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="ml-2 text-sm font-mono text-gray-400">System Prompt (Sent to Gemini 1.5 Pro)</span>
                    </div>
                    <div className="p-4 overflow-auto flex-1 font-mono text-xs text-green-400">
                        <pre className="whitespace-pre-wrap">{job.promptMessage || "Generating prompt..."}</pre>
                    </div>
                </div>

                {/* ΔΕΞΙΑ: Η απάντηση (Blueprint) */}
                <div className="flex flex-col h-[700px] bg-gray-900 rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
                    <div className="bg-gray-800 p-3 border-b border-gray-700 flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-400">Generated Architectural Blueprint</span>
                    </div>

                    <div className="p-4 overflow-auto flex-1 font-mono text-sm text-blue-300 relative">
                        {job.status === 'ANALYZING' ? (
                            // Loading Animation
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80">
                                <div className="animate-pulse flex flex-col items-center">
                                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent border-dashed rounded-full animate-spin mb-4"></div>
                                    <p className="text-blue-400 text-lg">AI Agent is analyzing the repository...</p>
                                    <p className="text-gray-500 text-xs mt-2">Checking pom.xml, scanning dependencies, matching AWS services...</p>
                                </div>
                            </div>
                        ) : (
                            // Completed Blueprint
                            <pre className="whitespace-pre-wrap">
                {job.blueprintJson ? JSON.stringify(JSON.parse(job.blueprintJson), null, 2) : "No data generated."}
              </pre>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AnalyzedRepo;