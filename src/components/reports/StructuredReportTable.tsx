"use client";
import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp, Filter, CheckCircle, RefreshCw, FileText, FileSpreadsheet, Info } from "lucide-react";
// Импортируем FilePdf напрямую, без использования barrel оптимизации
import { FilePdf as FileDocument } from "lucide-react/dist/esm/icons";

// Типы данных
interface DomainAnalysisResult {
  domain_name: string; // Изменено с domain на domain_name для соответствия с backend
  has_snapshot?: boolean;
  availability_ts?: number;
  total_snapshots?: number;
  timemap_count?: number;
  first_snapshot?: string;
  last_snapshot?: string;
  avg_interval_days?: number;
  max_gap_days?: number;
  years_covered?: number;
  snapshots_per_year?: string;
  unique_versions?: number;
  is_good?: boolean;
  recommended?: boolean;
  analysis_time_sec?: number;
  wayback_history_summary?: Record<string, any>;
  seo_metrics?: Record<string, any>;
  thematic_analysis_result?: Record<string, any>;
  assessment_score?: number;
  assessment_summary?: string;
  majestic_data?: {
    domain_authority?: number;
    page_authority?: number;
    trust_flow?: number;
    citation_flow?: number;
    backlinks?: number;
    referring_domains?: number;
  };
}

interface StructuredReportTableProps {
  data: DomainAnalysisResult[];
  reportId?: string;
  onSaveReport?: () => void;
}

export function StructuredReportTable({ data, reportId, onSaveReport }: StructuredReportTableProps) {
  const [sortField, setSortField] = useState<string>('domain_name'); // Изменено с domain на domain_name
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState({
    minSnapshots: 0,
    minYears: 0,
    maxAvgInterval: 1000,
    maxGap: 1000,
    minTimemap: 0,
    showRecommendedOnly: false
  });
  const [filterVisible, setFilterVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMajesticData, setLoadingMajesticData] = useState<Record<string, boolean>>({});
  const itemsPerPage = 20;

  // Получаем API URL из переменных окружения
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://okw04g0os0cocooowskcwg4s.alettidesign.ru/api/v1';

  // Функция для загрузки данных Majestic
  const fetchMajesticData = async (domain: string, index: number) => {
    try {
      setLoadingMajesticData(prev => ({ ...prev, [domain]: true }));
      
      const response = await fetch(`${API_URL}/analysis/majestic/${domain}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Обновляем данные в таблице
      const newData = [...data];
      newData[index] = {
        ...newData[index],
        majestic_data: result.majestic_data
      };
      
      // Обновляем состояние (в реальном приложении здесь должно быть обновление через контекст или Redux)
      // Для демонстрации просто обновляем локальное состояние
      data[index].majestic_data = result.majestic_data;
      
    } catch (error) {
      console.error('Error fetching Majestic data:', error);
      alert(`Ошибка при загрузке данных Majestic: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoadingMajesticData(prev => ({ ...prev, [domain]: false }));
    }
  };

  // Мемоизированная функция сортировки
  const sortData = useMemo(() => {
    return (a: DomainAnalysisResult, b: DomainAnalysisResult) => {
      let aValue = a[sortField as keyof DomainAnalysisResult];
      let bValue = b[sortField as keyof DomainAnalysisResult];
      
      // Обработка undefined значений
      if (aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      if (bValue === undefined) return sortDirection === 'asc' ? -1 : 1;
      
      // Сравнение строк
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // Сравнение чисел и булевых значений
      return sortDirection === 'asc' 
        ? (aValue > bValue ? 1 : -1) 
        : (aValue < bValue ? 1 : -1);
    };
  }, [sortField, sortDirection]);

  // Мемоизированная функция фильтрации
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Поиск по домену
      if (searchTerm && !item.domain_name.toLowerCase().includes(searchTerm.toLowerCase())) { // Изменено с domain на domain_name
        return false;
      }
      
      // Применение фильтров
      if (filters.showRecommendedOnly && !item.recommended) {
        return false;
      }
      
      if (item.total_snapshots !== undefined && item.total_snapshots < filters.minSnapshots) {
        return false;
      }
      
      if (item.years_covered !== undefined && item.years_covered < filters.minYears) {
        return false;
      }
      
      if (item.avg_interval_days !== undefined && item.avg_interval_days > filters.maxAvgInterval) {
        return false;
      }
      
      if (item.max_gap_days !== undefined && item.max_gap_days > filters.maxGap) {
        return false;
      }
      
      if (item.timemap_count !== undefined && item.timemap_count < filters.minTimemap) {
        return false;
      }
      
      return true;
    });
  }, [data, searchTerm, filters]);

  // Мемоизированные отсортированные данные
  const sortedData = useMemo(() => {
    return [...filteredData].sort(sortData);
  }, [filteredData, sortData]);

  // Пагинированные данные
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  // Общее количество страниц
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // Функция для изменения сортировки
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Функция для экспорта отчета
  const handleExport = async (format: string) => {
    if (!reportId) return;
    
    try {
      setExporting(true);
      
      // Получаем API URL из переменных окружения или используем значение по умолчанию
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://45.155.207.218:8012';
      
      const response = await fetch(
        `${apiUrl}/api/v1/analysis/export/${reportId}?format=${format}`,
        { method: 'GET' }
      );
      
      if (!response.ok) {
        throw new Error(`Ошибка экспорта: ${response.statusText}`);
      }
      
      // Получаем имя файла из заголовка Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `report-${reportId}.${format}`;
      
      // Создаем blob и ссылку для скачивания
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Ошибка при экспорте отчета:', error);
      alert(`Ошибка при экспорте отчета: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  // Форматирование даты
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Панель инструментов */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Поиск по домену..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Button 
            variant="outline" 
            onClick={() => setFilterVisible(!filterVisible)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            Фильтры
          </Button>
        </div>
        
        {reportId && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleExport('excel')}
              disabled={exporting}
              className="flex items-center gap-1"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="flex items-center gap-1"
            >
              <FileText className="h-4 w-4" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              className="flex items-center gap-1"
            >
              <FileDocument className="h-4 w-4" />
              PDF
            </Button>
          </div>
        )}
      </div>
      
      {/* Панель фильтров */}
      {filterVisible && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div>
            <label className="text-sm font-medium">Мин. снимков</label>
            <Input
              type="number"
              min="0"
              value={filters.minSnapshots}
              onChange={(e) => setFilters({...filters, minSnapshots: parseInt(e.target.value) || 0})}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Мин. лет</label>
            <Input
              type="number"
              min="0"
              value={filters.minYears}
              onChange={(e) => setFilters({...filters, minYears: parseInt(e.target.value) || 0})}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Макс. интервал (дни)</label>
            <Input
              type="number"
              min="0"
              value={filters.maxAvgInterval}
              onChange={(e) => setFilters({...filters, maxAvgInterval: parseInt(e.target.value) || 0})}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Макс. разрыв (дни)</label>
            <Input
              type="number"
              min="0"
              value={filters.maxGap}
              onChange={(e) => setFilters({...filters, maxGap: parseInt(e.target.value) || 0})}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Мин. карт времени</label>
            <Input
              type="number"
              min="0"
              value={filters.minTimemap}
              onChange={(e) => setFilters({...filters, minTimemap: parseInt(e.target.value) || 0})}
            />
          </div>
          <div className="flex items-end">
            <Button 
              variant={filters.showRecommendedOnly ? "default" : "outline"}
              onClick={() => setFilters({...filters, showRecommendedOnly: !filters.showRecommendedOnly})}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Только рекомендованные
            </Button>
          </div>
        </div>
      )}
      
      {/* Таблица */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('domain_name')} // Изменено с domain на domain_name
              >
                <div className="flex items-center">
                  Домен
                  {sortField === 'domain_name' && ( // Изменено с domain на domain_name
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('total_snapshots')}
              >
                <div className="flex items-center">
                  Всего снимков
                  {sortField === 'total_snapshots' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('first_snapshot')}
              >
                <div className="flex items-center">
                  Первый снимок
                  {sortField === 'first_snapshot' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('last_snapshot')}
              >
                <div className="flex items-center">
                  Последний снимок
                  {sortField === 'last_snapshot' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('years_covered')}
              >
                <div className="flex items-center">
                  Лет охвата
                  {sortField === 'years_covered' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('avg_interval_days')}
              >
                <div className="flex items-center">
                  Средний интервал
                  {sortField === 'avg_interval_days' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('max_gap_days')}
              >
                <div className="flex items-center">
                  Макс. разрыв
                  {sortField === 'max_gap_days' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('recommended')}
              >
                <div className="flex items-center">
                  Рекомендован
                  {sortField === 'recommended' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item, index) => (
              <TableRow key={item.domain_name} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <TableCell className="font-medium">{item.domain_name}</TableCell>
                <TableCell>{item.total_snapshots || '-'}</TableCell>
                <TableCell>{formatDate(item.first_snapshot)}</TableCell>
                <TableCell>{formatDate(item.last_snapshot)}</TableCell>
                <TableCell>{item.years_covered?.toFixed(1) || '-'}</TableCell>
                <TableCell>{item.avg_interval_days?.toFixed(1) || '-'}</TableCell>
                <TableCell>{item.max_gap_days?.toFixed(1) || '-'}</TableCell>
                <TableCell>
                  {item.recommended ? (
                    <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      Да
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                      Нет
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => fetchMajesticData(item.domain_name, index)}
                      disabled={loadingMajesticData[item.domain_name]}
                      title="Загрузить данные Majestic"
                    >
                      {loadingMajesticData[item.domain_name] ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Info className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <a 
                            href={`https://web.archive.org/web/*/${item.domain_name}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            Открыть в Wayback Machine
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <a 
                            href={`https://${item.domain_name}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            Открыть сайт
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Показано {paginatedData.length} из {sortedData.length} доменов
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Назад
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = currentPage <= 3 
                  ? i + 1 
                  : currentPage >= totalPages - 2 
                    ? totalPages - 4 + i 
                    : currentPage - 2 + i;
                
                if (pageNum <= 0 || pageNum > totalPages) return null;
                
                return (
                  <Button 
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span>...</span>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Вперед
            </Button>
          </div>
        </div>
      )}
      
      {/* Majestic Data Modal */}
      {/* Здесь можно добавить модальное окно для отображения данных Majestic */}
    </div>
  );
}
