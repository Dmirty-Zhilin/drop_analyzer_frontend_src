"use client";

import React, { useState, useEffect } from 'react';
import { analysisApi } from '@/lib/api-client';
import { AnalysisProgressBar } from '@/components/analysis/AnalysisProgressBar';

export default function HomePage() {
  const [domains, setDomains] = useState<string>('');
  const [taskName, setTaskName] = useState<string>(`Анализ ${new Date().toLocaleString()}`);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<string>('pending');
  const [progressValue, setProgressValue] = useState<number>(0);
  const [currentDomain, setCurrentDomain] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [useTestData, setUseTestData] = useState<boolean>(false);

  // Функция для отправки запроса на анализ доменов
  const handleAnalyze = async () => {
    if (!domains.trim()) {
      setError('Пожалуйста, введите хотя бы один домен');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTaskId(null);
    setTaskStatus('pending');
    setProgressValue(0);
    setCurrentDomain(null);
    setResults([]);

    try {
      // Разбиваем строку доменов на массив
      const domainList = domains
        .split('\n')
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0);

      // Создаем задачу анализа
      const response = await analysisApi.createTask({
        task_name: taskName,
        domains: domainList,
        use_test_data: useTestData
      });

      setTaskId(response.id);
      
      // Запускаем опрос статуса задачи
      pollTaskStatus(response.id);
    } catch (err) {
      console.error('Error starting analysis:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при запуске анализа');
      setIsLoading(false);
    }
  };

  // Функция для опроса статуса задачи
  const pollTaskStatus = async (id: string) => {
    try {
      const taskData = await analysisApi.getTaskStatus(id);
      
      setTaskStatus(taskData.status);
      setProgressValue(taskData.progress || 0);
      setCurrentDomain(taskData.current_domain || null);
      
      if (taskData.results && taskData.results.length > 0) {
        setResults(taskData.results);
      }
      
      if (taskData.status === 'completed') {
        setIsLoading(false);
      } else if (taskData.status === 'failed') {
        setError(`Задача анализа завершилась с ошибкой: ${taskData.error || 'Неизвестная ошибка'}`);
        setIsLoading(false);
      } else {
        // Продолжаем опрос через 1 секунду
        setTimeout(() => pollTaskStatus(id), 1000);
      }
    } catch (err) {
      console.error('Error polling task status:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при получении статуса задачи');
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-white">Analyze Drop Domains</h1>
        
        <div className="mb-6">
          <label htmlFor="domains" className="block text-sm font-medium text-gray-300 mb-2">
            Enter Domain Names (one per line):
          </label>
          <textarea
            id="domains"
            rows={10}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={domains}
            onChange={(e) => setDomains(e.target.value)}
            placeholder="example.com&#10;example.org&#10;example.net"
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="taskName" className="block text-sm font-medium text-gray-300 mb-2">
            Task Name:
          </label>
          <input
            type="text"
            id="taskName"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-6 flex items-center">
          <input
            type="checkbox"
            id="useTestData"
            className="mr-2 h-4 w-4"
            checked={useTestData}
            onChange={(e) => setUseTestData(e.target.checked)}
            disabled={isLoading}
          />
          <label htmlFor="useTestData" className="text-sm font-medium text-gray-300">
            Use Test Data (faster results for demonstration)
          </label>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-md">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        
        <div className="flex justify-center">
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className={`px-6 py-3 rounded-md font-medium text-white shadow-sm transition duration-150 ease-in-out ${
              isLoading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {isLoading ? 'Processing...' : 'Analyze Domains'}
          </button>
        </div>
        
        {isLoading && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">Task Status</h2>
            <AnalysisProgressBar 
              progress={progressValue} 
              status={taskStatus} 
              currentDomain={currentDomain}
              results={results}
            />
          </div>
        )}
        
        {!isLoading && results.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">Analysis Results</h2>
            <div className="bg-gray-700 p-4 rounded-md shadow">
              <table className="min-w-full divide-y divide-gray-600">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Domain</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Snapshots</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Years</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Recommended</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Long-live</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {results.map((result, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-800/50' : ''}>
                      <td className="px-4 py-3 text-sm text-white">{result.domain_name || result.domain}</td>
                      <td className="px-4 py-3 text-sm text-white">{result.total_snapshots || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-white">{result.years_covered || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.recommended ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                        }`}>
                          {result.recommended ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.is_long_live ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                        }`}>
                          {result.is_long_live ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <div className="text-right mt-4 text-gray-400 text-sm">v 0.2</div>
    </div>
  );
}
