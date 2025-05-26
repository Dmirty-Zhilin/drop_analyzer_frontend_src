"use client";

import React, { useState, useEffect } from 'react';
import { StructuredReportTable } from '@/components/reports/StructuredReportTable';

interface ReportData {
  report_id: string;
  created_at: string;
  domains: string;
  results: Array<{
    domain_name: string;
    wayback_history_summary: string;
    seo_metrics: string;
    thematic_analysis_result: string;
    assessment_score: number;
    assessment_summary: string;
  }>;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
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
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const data = await fetchWithRedirect(`${API_URL}/reports/`);
        setReports(data.items || []);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setError(error instanceof Error ? error.message : 'Ошибка при загрузке отчетов');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReports();
  }, [API_URL]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold text-center mb-6 text-white">Загрузка отчетов...</h1>
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
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-white">Сохраненные отчеты</h1>
        
        {reports.length === 0 ? (
          <p className="text-gray-400 text-center">Нет сохраненных отчетов</p>
        ) : (
          <div className="space-y-6">
            {reports.map((report) => (
              <div key={report.report_id} className="bg-gray-700 p-4 rounded-md shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white">Отчет #{report.report_id}</h2>
                  <a
                    href={`/reports/${report.report_id}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out"
                  >
                    Просмотреть
                  </a>
                </div>
                <p className="text-gray-300">
                  <span className="font-semibold">Дата создания:</span> {new Date(report.created_at).toLocaleString()}
                </p>
                <p className="text-gray-300">
                  <span className="font-semibold">Домены:</span> {report.domains}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
