"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiSettings } from '@/components/settings/ApiSettings';
import { StructuredReportTable } from '@/components/reports/StructuredReportTable';
import { AnalysisProgressBar } from '@/components/analysis/AnalysisProgressBar';

interface Task {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  current_domain?: string;
  progress?: {
    current: number;
    total: number;
  };
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
  const [progressValue, setProgressValue] = useState(0);
  
  // Получаем API URL из переменных окружения
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://okw04g0os0cocooowskcwg4s.alettidesign.ru/api/v1';
  
  // Функция для обработки редиректов и ошибок сети
  const fetchWithRedirect = async (url: string, options: RequestInit = {}) => {
    try {
      console.log(`Fetching URL: ${url}`);
      // Добавляем параметр redirect: 'follow' для обработки редиректов
      const response = await fetch(url, {
        ...options,
        redirect: 'follow', // Явно указываем следовать редиректам
      });
      
      if (!response.ok) {
        console.error(`HTTP error! Status: ${response.status} for URL: ${url}`);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Response data from ${url}:`, data);
      return data;
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
      if (error instanceof TypeError && error.message.includes('NetworkError')) {
        throw new Error('Сетевая ошибка. Проверьте подключение к API серверу.');
      }
      throw error;
    }
  };
  
  // Функция для извлечения task_id из ответа API
  const extractTaskId = (response: any): string => {
    console.log('Extracting task_id from response:', response);
    
    // Проверяем различные варианты расположения task_id в ответе
    if (response && typeof response === 'object') {
      // Вариант 1: Прямое поле task_id
      if (response.task_id) {
        return response.task_id;
      }
      
      // Вариант 2: Поле id
      if (response.id) {
        return response.id;
      }
      
      // Вариант 3: Вложенное поле task.id или task.task_id
      if (response.task) {
        if (response.task.task_id) {
          return response.task.task_id;
        }
        if (response.task.id) {
          return response.task.id;
        }
      }
      
      // Вариант 4: Поле data.task_id или data.id
      if (response.data) {
        if (response.data.task_id) {
          return response.data.task_id;
        }
        if (response.data.id) {
          return response.data.id;
        }
      }
      
      // Вариант 5: Если ответ - это строка, возможно это и есть task_id
      if (typeof response === 'string') {
        return response;
      }
      
      // Вариант 6: Если ответ - это массив с одним элементом, проверяем его
      if (Array.isArray(response) && response.length === 1) {
        const item = response[0];
        if (item && typeof item === 'object') {
          if (item.task_id) {
            return item.task_id;
          }
          if (item.id) {
            return item.id;
          }
        } else if (typeof item === 'string') {
          return item;
        }
      }
      
      // Вариант 7: Поиск по всем полям первого уровня, которые могут содержать task_id
      for (const key in response) {
        if (
          (key.includes('task') || key.includes('id')) && 
          typeof response[key] === 'string' && 
          response[key].length > 5
        ) {
          console.log(`Found potential task_id in field ${key}:`, response[key]);
          return response[key];
        }
      }
    }
    
    // Если не удалось найти task_id, генерируем временный ID
    // Это позволит продолжить работу, но с ограниченной функциональностью
    console.warn('Could not extract task_id from response, generating temporary ID');
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };
  
  // Функция для извлечения результатов из ответа API
  const extractResults = (response: any): any => {
    console.log('Extracting results from response:', response);
    
    // Проверяем различные варианты расположения результатов в ответе
    if (response && typeof response === 'object') {
      // Вариант 1: Прямое поле results
      if (response.results && Array.isArray(response.results)) {
        return {
          task_id: response.task_id || 'unknown',
          results: response.results
        };
      }
      
      // Вариант 2: Поле data.results
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        return {
          task_id: response.task_id || response.data.task_id || 'unknown',
          results: response.data.results
        };
      }
      
      // Вариант 3: Сам ответ является массивом результатов
      if (Array.isArray(response)) {
        // Проверяем, что это похоже на массив результатов анализа доменов
        if (response.length > 0 && response[0].domain_name) {
          return {
            task_id: 'unknown',
            results: response
          };
        }
      }
      
      // Вариант 4: Поле domains или domain_results
      if (response.domains && Array.isArray(response.domains)) {
        return {
          task_id: response.task_id || 'unknown',
          results: response.domains
        };
      }
      
      if (response.domain_results && Array.isArray(response.domain_results)) {
        return {
          task_id: response.task_id || 'unknown',
          results: response.domain_results
        };
      }
      
      // Вариант 5: Поле data является массивом результатов
      if (response.data && Array.isArray(response.data)) {
        if (response.data.length > 0 && response.data[0].domain_name) {
          return {
            task_id: response.task_id || 'unknown',
            results: response.data
          };
        }
      }
      
      // Вариант 6: Результаты находятся в поле с именем, содержащим "result" или "domain"
      for (const key in response) {
        if (
          (key.includes('result') || key.includes('domain')) && 
          Array.isArray(response[key]) && 
          response[key].length > 0
        ) {
          console.log(`Found potential results in field ${key}:`, response[key]);
          return {
            task_id: response.task_id || 'unknown',
            results: response[key]
          };
        }
      }
      
      // Вариант 7: Если в ответе есть только один домен
      if (response.domain_name) {
        return {
          task_id: response.task_id || 'unknown',
          results: [response]
        };
      }
    }
    
    // Если не удалось найти результаты, возвращаем пустой массив
    console.warn('Could not extract results from response, returning empty array');
    return {
      task_id: 'unknown',
      results: []
    };
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSaveStatus(null);
    setProgressValue(0);
    
    try {
      // Разбиваем ввод на отдельные домены
      const domains = domainsInput.split('\n').filter(domain => domain.trim() !== '');
      
      if (domains.length === 0) {
        throw new Error('Пожалуйста, введите хотя бы один домен');
      }
      
      // Создаем новую задачу анализа
      const response = await fetchWithRedirect(`${API_URL}/analysis/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          task_name: "Domain Analysis",
          domains: domains 
        }),
      });
      
      console.log('Analysis task created, raw response:', response);
      
      // Извлекаем task_id из ответа, используя гибкую функцию
      const taskId = extractTaskId(response);
      
      if (!taskId) {
        throw new Error('Не удалось получить идентификатор задачи из ответа сервера');
      }
      
      console.log('Extracted task_id:', taskId);
      
      // Инициализируем задачу с начальными значениями прогресса
      setCurrentTask({
        task_id: taskId,
        status: 'pending',
        progress: {
          current: 0,
          total: domains.length
        }
      });
      
      // Начинаем опрос статуса задачи
      pollTaskStatus(taskId);
    } catch (error) {
      console.error('Error submitting domains:', error);
      setError(error instanceof Error ? error.message : 'Произошла ошибка при отправке доменов');
      setIsLoading(false);
    }
  };
  
  const pollTaskStatus = async (taskId: string) => {
    if (!taskId) {
      console.error('Invalid task ID:', taskId);
      setError('Некорректный идентификатор задачи');
      setIsLoading(false);
      return;
    }
    
    try {
      // Пробуем несколько вариантов URL для получения статуса задачи
      let response;
      let success = false;
      
      // Массив возможных путей API для получения статуса задачи
      const possiblePaths = [
        `/analysis/task/${taskId}`,
        `/analysis/tasks/${taskId}`,
        `/analysis/status/${taskId}`,
        `/analysis/${taskId}/status`,
        `/analysis/${taskId}`,
        `/tasks/${taskId}`,
        `/task/${taskId}`,
        `/status/${taskId}`
      ];
      
      // Пробуем каждый путь по очереди
      for (const path of possiblePaths) {
        try {
          response = await fetchWithRedirect(`${API_URL}${path}`);
          success = true;
          console.log(`Successfully fetched task status from ${path}:`, response);
          break;
        } catch (err) {
          console.warn(`Failed to fetch task status from ${path}:`, err);
          // Продолжаем с следующим путем
        }
      }
      
      if (!success) {
        throw new Error('Не удалось получить статус задачи ни по одному из известных путей API');
      }
      
      // Обновляем информацию о задаче
      setCurrentTask(prev => {
        // Извлекаем статус из ответа, с fallback на предыдущее значение
        const status = response.status || 
                      (response.data && response.data.status) || 
                      (response.task && response.task.status) || 
                      prev?.status || 
                      'pending';
        
        // Извлекаем информацию о прогрессе, с fallback на предыдущее значение
        let progress = prev?.progress || { current: 0, total: 1 };
        
        // Пытаемся извлечь прогресс из разных возможных структур ответа
        if (response.progress) {
          progress = response.progress;
        } else if (response.current && response.total) {
          progress = { current: response.current, total: response.total };
        } else if (response.data && response.data.progress) {
          progress = response.data.progress;
        } else if (response.task && response.task.progress) {
          progress = response.task.progress;
        }
        
        // Извлекаем текущий домен, если он есть
        const currentDomain = response.current_domain || 
                             response.domain || 
                             (response.data && response.data.current_domain) ||
                             (response.task && response.task.current_domain);
        
        // Вычисляем процент выполнения для прогресс-бара
        const progressPercent = (progress.current / progress.total) * 100;
        setProgressValue(progressPercent);
        
        return {
          task_id: taskId,
          status,
          message: response.message || 
                  (response.data && response.data.message) || 
                  (response.task && response.task.message) || 
                  prev?.message,
          current_domain: currentDomain,
          progress
        };
      });
      
      // Определяем, завершена ли задача
      const isCompleted = response.status === 'completed' || 
                         (response.data && response.data.status === 'completed') ||
                         (response.task && response.task.status === 'completed');
      
      // Определяем, завершилась ли задача с ошибкой
      const isFailed = response.status === 'failed' || 
                      (response.data && response.data.status === 'failed') ||
                      (response.task && response.task.status === 'failed');
      
      if (isCompleted) {
        // Задача завершена, получаем результаты
        // Пробуем несколько вариантов URL для получения результатов
        let reportResponse;
        let reportSuccess = false;
        
        // Расширенный список возможных путей для получения результатов
        const possibleResultPaths = [
          `/analysis/results/${taskId}`,
          `/analysis/${taskId}/results`,
          `/analysis/result/${taskId}`,
          `/analysis/${taskId}/result`,
          `/results/${taskId}`,
          `/${taskId}/results`,
          `/result/${taskId}`,
          `/${taskId}/result`,
          `/analysis/tasks/${taskId}/results`,
          `/analysis/tasks/${taskId}/result`,
          `/analysis/task/${taskId}/results`,
          `/analysis/task/${taskId}/result`,
          `/tasks/${taskId}/results`,
          `/tasks/${taskId}/result`,
          `/task/${taskId}/results`,
          `/task/${taskId}/result`,
          `/analysis/${taskId}`, // Иногда статус и результаты возвращаются по одному пути
          `/task/${taskId}`,
          `/tasks/${taskId}`
        ];
        
        // Пробуем каждый путь по очереди
        for (const path of possibleResultPaths) {
          try {
            reportResponse = await fetchWithRedirect(`${API_URL}${path}`);
            
            // Проверяем, содержит ли ответ результаты
            const extractedResults = extractResults(reportResponse);
            if (extractedResults && extractedResults.results && extractedResults.results.length > 0) {
              reportSuccess = true;
              reportResponse = extractedResults;
              console.log(`Successfully fetched results from ${path}:`, reportResponse);
              break;
            } else {
              console.warn(`Response from ${path} does not contain valid results:`, reportResponse);
            }
          } catch (err) {
            console.warn(`Failed to fetch results from ${path}:`, err);
            // Продолжаем с следующим путем
          }
        }
        
        // Если не удалось получить результаты, пробуем использовать данные из ответа статуса
        if (!reportSuccess) {
          console.log('Trying to extract results from status response:', response);
          const extractedResults = extractResults(response);
          if (extractedResults && extractedResults.results && extractedResults.results.length > 0) {
            reportSuccess = true;
            reportResponse = extractedResults;
            console.log('Successfully extracted results from status response:', reportResponse);
          }
        }
        
        if (!reportSuccess) {
          throw new Error('Не удалось получить результаты анализа ни по одному из известных путей API');
        }
        
        setTaskReport(reportResponse);
        setProgressValue(100); // Устанавливаем прогресс в 100%
        setIsLoading(false);
      } else if (isFailed) {
        // Задача завершилась с ошибкой
        const errorMessage = response.message || 
                           (response.data && response.data.message) || 
                           (response.task && response.task.message) || 
                           'Неизвестная ошибка';
        setError(`Задача не выполнена: ${errorMessage}`);
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
      // Подготавливаем данные для сохранения отчета
      // Проверяем наличие необходимых полей в результатах
      const results = taskReport.results.map(result => {
        // Убеждаемся, что все необходимые поля присутствуют
        return {
          domain_name: result.domain_name || 'unknown',
          wayback_history_summary: result.wayback_history_summary || '',
          seo_metrics: result.seo_metrics || '',
          thematic_analysis_result: result.thematic_analysis_result || '',
          assessment_score: result.assessment_score || 0,
          assessment_summary: result.assessment_summary || ''
        };
      });
      
      const response = await fetchWithRedirect(`${API_URL}/reports/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: taskReport.task_id || 'unknown',
          domains: results.map(r => r.domain_name).join(','),
          results: results
        }),
      });
      
      setSaveStatus({
        message: `Отчет успешно сохранен с ID: ${response.report_id || response.id || 'unknown'}`,
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
                  placeholder="example.com&#10;expired-domain.org&#10;another-one.net"
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
              {/* Task ID скрыт по требованию пользователя */}
              <p className="text-gray-300">Status: <span className={`font-semibold ${currentTask.status === 'completed' ? 'text-green-400' : currentTask.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}`}>{currentTask.status}</span></p>
              {currentTask.message && <p className="text-gray-400 italic">{currentTask.message}</p>}
              {isLoading && currentTask.status !== 'completed' && currentTask.status !== 'failed' && (
                <div className="mt-4">
                  <AnalysisProgressBar 
                    value={progressValue}
                    currentDomain={currentTask.current_domain}
                    progress={currentTask.progress}
                    status={currentTask.status}
                  />
                </div>
              )}
            </section>
          )}
          {taskReport && taskReport.results && (
            <section className="bg-gray-800 p-6 rounded-lg shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-white">Analysis Report</h2>
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
                    domain: result.domain_name || 'unknown',
                    wayback_history_summary: result.wayback_history_summary || '',
                    seo_metrics: result.seo_metrics || '',
                    thematic_analysis_result: result.thematic_analysis_result || '',
                    assessment_score: result.assessment_score || 0,
                    assessment_summary: result.assessment_summary || ''
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
