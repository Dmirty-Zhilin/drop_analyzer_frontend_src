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

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-4 py-3 text-left font-medium text-gray-500">Домен</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">SEO метрики</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Тематический анализ</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Оценка</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Сводка</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-3 font-medium">{item.domain_name}</td>
              <td className="px-4 py-3">
                {item.seo_metrics ? (
                  <div className="max-h-40 overflow-y-auto">
                    <pre className="text-xs">{JSON.stringify(item.seo_metrics, null, 2)}</pre>
                  </div>
                ) : (
                  <span className="text-gray-400">Н/Д</span>
                )}
              </td>
              <td className="px-4 py-3">
                {item.thematic_analysis_result ? (
                  <div className="max-h-40 overflow-y-auto">
                    <pre className="text-xs">{JSON.stringify(item.thematic_analysis_result, null, 2)}</pre>
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
