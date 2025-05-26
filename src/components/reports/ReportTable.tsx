"use client";
import React from 'react';

// Определение типов данных для отчета
interface DomainAnalysisResult {
  domain_name: string;
  wayback_history_summary?: Record<string, any>;
  seo_metrics?: Record<string, any>;
  thematic_analysis_result?: Record<string, any>;
  assessment_score?: number;
  assessment_summary?: string;
}

interface ReportTableProps {
  data: DomainAnalysisResult[];
}

export function ReportTable({ data }: ReportTableProps) {
  if (!data || data.length === 0) {
    return <div className="p-4 text-center text-gray-500">Нет данных для отображения</div>;
  }

  // Функция для форматирования JSON в читаемый вид
  const formatJsonData = (jsonData: Record<string, any> | string) => {
    if (typeof jsonData === 'string') {
      try {
        jsonData = JSON.parse(jsonData);
      } catch (e) {
        return jsonData;
      }
    }
    
    if (!jsonData || typeof jsonData !== 'object') {
      return 'Н/Д';
    }
    
    // Преобразуем JSON в читаемый формат для отображения в таблице
    return (
      <div className="space-y-1">
        {Object.entries(jsonData).map(([key, value], idx) => (
          <div key={idx} className="text-xs">
            <span className="font-medium">{key}:</span>{' '}
            {typeof value === 'object' 
              ? JSON.stringify(value) 
              : String(value)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-700">
            <th className="px-4 py-3 text-left font-medium text-gray-200">Домен</th>
            <th className="px-4 py-3 text-left font-medium text-gray-200">SEO метрики</th>
            <th className="px-4 py-3 text-left font-medium text-gray-200">Тематический анализ</th>
            <th className="px-4 py-3 text-left font-medium text-gray-200">Оценка</th>
            <th className="px-4 py-3 text-left font-medium text-gray-200">Сводка</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr 
              key={index} 
              className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-gray-700 transition-colors duration-150`}
            >
              <td className="px-4 py-3 font-medium">{item.domain_name}</td>
              <td className="px-4 py-3">
                {item.seo_metrics ? (
                  <div className="max-h-40 overflow-y-auto">
                    {formatJsonData(item.seo_metrics)}
                  </div>
                ) : (
                  <span className="text-gray-400">Н/Д</span>
                )}
              </td>
              <td className="px-4 py-3">
                {item.thematic_analysis_result ? (
                  <div className="max-h-40 overflow-y-auto">
                    {formatJsonData(item.thematic_analysis_result)}
                  </div>
                ) : (
                  <span className="text-gray-400">Н/Д</span>
                )}
              </td>
              <td className="px-4 py-3">
                {item.assessment_score !== undefined ? (
                  <span className="font-medium">{item.assessment_score}</span>
                ) : (
                  <span className="text-gray-400">Н/Д</span>
                )}
              </td>
              <td className="px-4 py-3">
                {item.assessment_summary || <span className="text-gray-400">Н/Д</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
