/**
 * Утилиты для экспорта данных отчета в различные форматы
 */

import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface DomainAnalysisResult {
  domain_name: string;
  wayback_history_summary?: Record<string, any>;
  seo_metrics?: Record<string, any>;
  thematic_analysis_result?: Record<string, any>;
  assessment_score?: number;
  assessment_summary?: string;
}

/**
 * Экспортирует данные отчета в формат CSV
 */
export const exportToCSV = (results: DomainAnalysisResult[], filename: string = 'domain_analysis_report') => {
  // Подготовка данных для CSV
  const csvRows: string[] = [];
  
  // Заголовок CSV
  const headers = ['Domain', 'Assessment Score', 'Assessment Summary', 'Wayback History', 'SEO Metrics', 'Thematic Analysis'];
  csvRows.push(headers.join(','));
  
  // Данные
  results.forEach(result => {
    const row = [
      `"${result.domain_name}"`,
      result.assessment_score !== undefined ? result.assessment_score : 'N/A',
      `"${result.assessment_summary || 'N/A'}"`,
      `"${JSON.stringify(result.wayback_history_summary || {}).replace(/"/g, '""')}"`,
      `"${JSON.stringify(result.seo_metrics || {}).replace(/"/g, '""')}"`,
      `"${JSON.stringify(result.thematic_analysis_result || {}).replace(/"/g, '""')}"`,
    ];
    csvRows.push(row.join(','));
  });
  
  // Создание и скачивание файла
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
};

/**
 * Экспортирует данные отчета в формат Excel (XLSX)
 */
export const exportToExcel = (results: DomainAnalysisResult[], filename: string = 'domain_analysis_report') => {
  // Подготовка данных для Excel
  const worksheetData = results.map(result => {
    return {
      'Domain': result.domain_name,
      'Assessment Score': result.assessment_score !== undefined ? result.assessment_score : 'N/A',
      'Assessment Summary': result.assessment_summary || 'N/A',
      'Wayback History': JSON.stringify(result.wayback_history_summary || {}),
      'SEO Metrics': JSON.stringify(result.seo_metrics || {}),
      'Thematic Analysis': JSON.stringify(result.thematic_analysis_result || {})
    };
  });
  
  // Создание рабочей книги и листа
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Domain Analysis');
  
  // Создание и скачивание файла
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * Экспортирует данные отчета в формат JSON
 */
export const exportToJSON = (results: DomainAnalysisResult[], filename: string = 'domain_analysis_report') => {
  const jsonString = JSON.stringify(results, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  saveAs(blob, `${filename}_${new Date().toISOString().slice(0, 10)}.json`);
};
