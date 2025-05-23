"use client";

import React, { useState, useEffect, FormEvent } from 'react';

// Define types for API responses (can be moved to a types.ts file)
interface DomainInput {
  domain_name: string;
}

interface AnalysisTaskCreate {
  domains: DomainInput[];
}

interface AnalysisTaskResponse {
  task_id: string;
  status: string;
  message?: string;
  created_at?: string;
  updated_at?: string;
}

interface DomainAnalysisResult {
  domain_name: string;
  wayback_history_summary?: Record<string, any>;
  seo_metrics?: Record<string, any>;
  thematic_analysis_result?: Record<string, any>;
  assessment_score?: number;
  assessment_summary?: string;
}

interface AnalysisFullReportResponse extends AnalysisTaskResponse {
  results?: DomainAnalysisResult[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/analysis';

export default function HomePage() {
  const [domainsInput, setDomainsInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTask, setCurrentTask] = useState<AnalysisTaskResponse | null>(null);
  const [taskReport, setTaskReport] = useState<AnalysisFullReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sseSource, setSseSource] = useState<EventSource | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setTaskReport(null);
    setCurrentTask(null);
    if (sseSource) {
        sseSource.close();
        setSseSource(null);
    }
    setIsLoading(true);

    const domainNames = domainsInput.split('\n').map(d => d.trim()).filter(d => d.length > 0);
    if (domainNames.length === 0) {
      setError('Please enter at least one domain name.');
      setIsLoading(false);
      return;
    }

    const payload: AnalysisTaskCreate = {
      domains: domainNames.map(name => ({ domain_name: name }))
    };

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: AnalysisTaskResponse = await response.json();
      setCurrentTask(data); // Set initial task data, SSE will update it
      // setIsLoading will be managed by SSE events or errors

    } catch (err: any) {
      setError(err.message || 'Failed to submit domains for analysis.');
      console.error(err);
      setIsLoading(false); // Stop loading if initial task creation fails
    }
  };

 const fetchTaskReport = async (taskId: string) => {
    if (!taskId) return;
    // setIsLoading(true); // isLoading should already be true or managed by SSE
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/report`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const data: AnalysisFullReportResponse = await response.json();
      setTaskReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch task report.');
    } finally {
      setIsLoading(false); // Final loading state update
    }
  };

  // SSE setup
  useEffect(() => {
    if (currentTask && currentTask.task_id && (currentTask.status === 'pending' || currentTask.status === 'processing')) {
      // Close any existing SSE connection before opening a new one
      if (sseSource) {
        sseSource.close();
      }

      const source = new EventSource(`${API_BASE_URL}/tasks/${currentTask.task_id}/stream-status`);
      setSseSource(source);
      console.log(`SSE connection opened for task: ${currentTask.task_id}`);

      source.onmessage = (event) => {
        try {
            const updatedTaskStatus: AnalysisTaskResponse = JSON.parse(event.data);
            console.log("SSE message received:", updatedTaskStatus);
            setCurrentTask(updatedTaskStatus); // Update task state with data from SSE

            if (updatedTaskStatus.status === 'completed' || updatedTaskStatus.status === 'failed') {
                // The backend now sends a custom 'complete' event for this, but onmessage can also catch it.
                // We'll rely on the 'complete' event listener for final actions.
            }
        } catch (e) {
            console.error("Failed to parse SSE message data:", event.data, e);
            setError("Received malformed status update.");
        }
      };

      source.addEventListener('complete', (event: MessageEvent) => {
        console.log("SSE 'complete' event received:", event.data);
        try {
            const finalTaskStatus: AnalysisTaskResponse = JSON.parse(event.data);
            setCurrentTask(finalTaskStatus);
            if (finalTaskStatus.status === 'completed') {
                fetchTaskReport(finalTaskStatus.task_id);
            } else if (finalTaskStatus.status === 'failed') {
                setError(finalTaskStatus.message || 'Task failed as per SSE completion event.');
                setIsLoading(false);
            }
        } catch (e) {
            console.error("Failed to parse SSE 'complete' event data:", event.data, e);
            setError("Received malformed task completion data.");
            setIsLoading(false);
        }
        source.close();
        setSseSource(null);
        console.log(`SSE connection closed for task: ${currentTask.task_id} after 'complete' event.`);
      });

      source.addEventListener('error', (event: MessageEvent) => {
        // The 'error' event from EventSource is generic. We also listen for custom 'error' event if backend sends it.
        // For now, assume any EventSource error means the stream has issues.
        console.error('SSE Error Event:', event);
        // Check if it's a custom error message from backend
        if (event.data) {
            try {
                const errorData = JSON.parse(event.data);
                if (errorData.error) {
                    setError(`SSE Error: ${errorData.error}`);
                }
            } catch (e) {
                 setError('SSE connection error. Please check task status manually or try again.');
            }
        } else {
            setError('SSE connection error. Please check task status manually or try again.');
        }
        source.close();
        setSseSource(null);
        setIsLoading(false); // Stop loading on SSE error
        console.log(`SSE connection closed for task: ${currentTask.task_id} due to error.`);
      });

      return () => {
        if (source) {
          source.close();
          setSseSource(null);
          console.log(`SSE connection closed for task: ${currentTask.task_id} on component unmount/cleanup.`);
        }
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTask?.task_id]); // Re-run effect if task_id changes (e.g., new task submitted)
  
  // Effect to handle initial status when currentTask is set but status is already completed/failed
  // This might happen if the task finishes very quickly before SSE connection is established
  useEffect(() => {
    if (currentTask && currentTask.task_id && !sseSource) {
        if (currentTask.status === 'completed') {
            fetchTaskReport(currentTask.task_id);
            setIsLoading(false);
        } else if (currentTask.status === 'failed') {
            setError(currentTask.message || 'Task failed.');
            setIsLoading(false);
        } else if (currentTask.status === 'pending' || currentTask.status === 'processing'){
            // This will trigger the SSE connection useEffect above
            setIsLoading(true);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTask?.status, currentTask?.task_id, sseSource]);

  return (
    <div className="space-y-8">
      <section className="bg-gray-800 p-6 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">Analyze Drop Domains</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="domains" className="block text-sm font-medium text-gray-300 mb-1">
              Enter Domain Names (one per line):
            </label>
            <textarea
              id="domains"
              name="domains"
              rows={10}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-100 placeholder-gray-400"
              placeholder="example.com\nexpired-domain.org\nanother-one.net"
              value={domainsInput}
              onChange={(e) => setDomainsInput(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-md shadow-md disabled:opacity-50 transition duration-150 ease-in-out"
          >
            {isLoading ? 'Processing...' : 'Start Analysis'}
          </button>
        </form>
        {error && <p className="mt-4 text-red-400 text-center">Error: {error}</p>}
      </section>

      {currentTask && (
        <section className="bg-gray-800 p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-white">Task Status</h2>
          <p className="text-gray-300">Task ID: <span className="font-mono text-indigo-400">{currentTask.task_id}</span></p>
          <p className="text-gray-300">Status: <span className={`font-semibold ${currentTask.status === 'completed' ? 'text-green-400' : currentTask.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}`}>{currentTask.status}</span></p>
          {currentTask.message && <p className="text-gray-400 italic">{currentTask.message}</p>}
          {isLoading && currentTask.status !== 'completed' && currentTask.status !== 'failed' && (
            <div className="mt-4">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-slate-700 h-10 w-10"></div>
                <div className="flex-1 space-y-6 py-1">
                  <div className="h-2 bg-slate-700 rounded"></div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-2 bg-slate-700 rounded col-span-2"></div>
                      <div className="h-2 bg-slate-700 rounded col-span-1"></div>
                    </div>
                    <div className="h-2 bg-slate-700 rounded"></div>
                  </div>
                </div>
              </div>
              <p className="text-center text-yellow-400 mt-2">{currentTask.message || "Processing... please wait."}</p>
            </div>
          )}
        </section>
      )}

      {taskReport && taskReport.results && (
        <section className="bg-gray-800 p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-white">Analysis Report (Task ID: {taskReport.task_id})</h2>
          <div className="space-y-6">
            {taskReport.results.map((result, index) => (
              <div key={index} className="bg-gray-700 p-4 rounded-md shadow">
                <h3 className="text-xl font-semibold text-indigo-400 mb-2">{result.domain_name}</h3>
                {result.wayback_history_summary && (
                  <div>
                    <h4 className="text-md font-medium text-gray-300">Wayback History:</h4>
                    <pre className="text-xs bg-gray-900 p-2 rounded overflow-x-auto text-gray-400">
                      {JSON.stringify(result.wayback_history_summary, null, 2)}
                    </pre>
                  </div>
                )}
                {result.thematic_analysis_result && (
                   <div className="mt-2">
                    <h4 className="text-md font-medium text-gray-300">Thematic Analysis:</h4>
                     <pre className="text-xs bg-gray-900 p-2 rounded overflow-x-auto text-gray-400">
                       {JSON.stringify(result.thematic_analysis_result, null, 2)}
                     </pre>
                   </div>
                )}
                {/* Add other metrics display here */}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

