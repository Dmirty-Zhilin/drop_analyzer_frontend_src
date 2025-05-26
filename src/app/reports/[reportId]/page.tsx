"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ReportTable } from '@/components/reports/ReportTable';

interface ReportData {
  report_id: string;
  created_at: string;
  domains: string;
  results: Array<{
    domain_name: string;
    wayback_history_summary: string | Record<string, any>;
    seo_metrics: string | Record<string, any>;
    thematic_analysis_result: string | Record<string, any>;
    assessment_score: number;
    assessment_summary: string;
  }>;
}

export default function ReportPage() {
  const params = useParams();
  const reportId = params.reportId as string;
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
  
  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const data = await fetchWithRedirect(`${API_URL}/reports/${reportId}`);
        setReport(data);
      } catch (error) {
        console.error('Error fetching report:', error);
        setError(error instanceof Error ? error.message : 'Ошибка при загрузке отчета');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (reportId) {
      fetchReport();
    }
  }, [reportId, API_URL]);
  
  const handleExportReport = async (format: string = 'json') => {
    try {
      // Запрашиваем экспорт отчета
      const response = await fetchWithRedirect(`${API_URL}/analysis/export/${reportId}?format=${format}`, {
        method: 'GET',
      });
      
      // Создаем ссылку для скачивания
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting report:', error);
      alert(error instanceof Error ? error.message : 'Ошибка при экспорте отчета');
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold text-center mb-6 text-white">Загрузка отчета...</h1>
          <div className="animate-pulse flex space-x-4">
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
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold text-center mb-6 text-white">Ошибка</h1>
          <p className="text-red-400 text-center">{error}</p>
        </div>
      </div>
    );
  }
  
  if (!report) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold text-center mb-6 text-white">Отчет не найден</h1>
          <p className="text-gray-400 text-center">Отчет с ID {reportId} не существует или был удален.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Отчет #{report.report_id}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => handleExportReport('json')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out"
            >
              Экспорт JSON
            </button>
            <button
              onClick={() => handleExportReport('csv')}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out"
            >
              Экспорт CSV
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-300">
            <span className="font-semibold">Дата создания:</span> {new Date(report.created_at).toLocaleString()}
          </p>
          <p className="text-gray-300">
            <span className="font-semibold">Домены:</span> {report.domains}
          </p>
        </div>
        
        <div className="bg-gray-700 p-4 rounded-md shadow">
          <ReportTable data={report.results} />
        </div>
      </div>
    </div>
  );
}
