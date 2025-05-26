"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiSettings } from '@/components/settings/ApiSettings';
import { StructuredReportTable } from '@/components/reports/StructuredReportTable';

interface Task {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
}

interface TaskReport {
  task_id: string;
  results: Array<{
    domain_name: string;
    wayback_history_summary: string;
    seo_metrics: string;
    thematic_analysis_result: string;
    assessment_score: number;
    assessment_summary: string;
  }>;
}

interface ApiSettings {
  openRouterApiKey?: string;
  enableThematicAnalysis?: boolean;
}

export default function Home() {
  const [domainsInput, setDomainsInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [taskReport, setTaskReport] = useState<TaskReport | null>(null);
  const [saveStatus, setSaveStatus] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [apiSettings, setApiSettings] = useState<ApiSettings>({});
  
  // Получаем API URL из переменных окружения
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://okw04g0os0cocooowskcwg4s.alettidesign.ru/api/v1';
  
  // Функция для обработки редиректов и ошибок сети
  const fetchWithRedirect = async (url: string, options: RequestInit = {}) => {
    try {
      // Добавляем параметр redirect: 'follow' для обработки редиректов
      const response = await fetch(url, {
        ...options,
        redirect: 'follow', // Явно указываем следовать редиректам
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      if (error instanceof TypeError && error.message.includes('NetworkError')) {
        throw new Error('Сетевая ошибка. Проверьте подключение к API серверу.');
      }
      throw error;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSaveStatus(null);
    
    try {
      // Разбиваем ввод на отдельные домены
      const domains = domainsInput.split('\n').filter(domain => domain.trim() !== '');
      
      if (domains.length === 0) {
        throw new Error('Пожалуйста, введите хотя бы один домен');
      }
      
      // Создаем новую задачу анализа
      const response = await fetchWithRedirect(`${API_URL}/analysis/tasks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domains }),
      });
      
      setCurrentTask(response);
      
      // Начинаем опрос статуса задачи
      pollTaskStatus(response.task_id);
    } catch (error) {
      console.error('Error submitting domains:', error);
      setError(error instanceof Error ? error.message : 'Произошла ошибка при отправке доменов');
      setIsLoading(false);
    }
  };
  
  const pollTaskStatus = async (taskId: string) => {
    try {
      const response = await fetchWithRedirect(`${API_URL}/analysis/tasks/${taskId}`);
      
      setCurrentTask(response);
      
      if (response.status === 'completed') {
        // Задача завершена, получаем результаты
        const reportResponse = await fetchWithRedirect(`${API_URL}/analysis/results/${taskId}`);
        setTaskReport(reportResponse);
        setIsLoading(false);
      } else if (response.status === 'failed') {
        // Задача завершилась с ошибкой
        setError(`Задача не выполнена: ${response.message || 'Неизвестная ошибка'}`);
        setIsLoading(false);
      } else {
        // Задача все еще выполняется, продолжаем опрос
        setTimeout(() => pollTaskStatus(taskId), 2000);
      }
    } catch (error) {
      console.error('Error polling task status:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при получении статуса задачи');
      setIsLoading(false);
    }
  };
  
  const handleSaveReport = async () => {
    if (!taskReport) return;
    
    setIsLoading(true);
    setSaveStatus(null);
    
    try {
      const response = await fetchWithRedirect(`${API_URL}/reports/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: taskReport.task_id,
          domains: taskReport.results.map(r => r.domain_name).join(','),
          results: taskReport.results
        }),
      });
      
      setSaveStatus({
        message: `Отчет успешно сохранен с ID: ${response.report_id}`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error saving report:', error);
      setSaveStatus({
        message: error instanceof Error ? error.message : 'Ошибка при сохранении отчета',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveApiSettings = async (settings: { openRouterApiKey: string; enableThematicAnalysis: boolean }) => {
    // Здесь должна быть логика сохранения настроек API
    // Для демонстрации просто обновляем локальное состояние
    setApiSettings(settings);
    return Promise.resolve();
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Tabs defaultValue="analysis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analysis">Анализ доменов</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analysis">
          <section className="bg-gray-800 p-6 rounded-lg shadow-xl mb-6">
            <h1 className="text-3xl font-bold text-center mb-6 text-white">Analyze Drop Domains</h1>
            
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-white">Analysis Report (Task ID: {taskReport.task_id})</h2>
                <button
                  onClick={handleSaveReport}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md shadow-sm disabled:opacity-50 transition duration-150 ease-in-out"
                >
                  Save Report
                </button>
              </div>
              
              {saveStatus && (
                <div className={`p-3 mb-4 rounded-md ${saveStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {saveStatus.message}
                </div>
              )}
              
              <div className="bg-gray-700 p-4 rounded-md shadow">
                <StructuredReportTable 
                  data={taskReport.results.map(result => ({
                    domain: result.domain_name,
                    wayback_history_summary: result.wayback_history_summary,
                    seo_metrics: result.seo_metrics,
                    thematic_analysis_result: result.thematic_analysis_result,
                    assessment_score: result.assessment_score,
                    assessment_summary: result.assessment_summary
                  }))} 
                  onSaveReport={handleSaveReport}
                />
              </div>
            </section>
          )}
        </TabsContent>
        
        <TabsContent value="settings">
          <ApiSettings 
            initialSettings={apiSettings}
            onSave={handleSaveApiSettings}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
