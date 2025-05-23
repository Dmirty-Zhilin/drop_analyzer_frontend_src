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
import { ChevronDown, ChevronUp, Filter, CheckCircle, Clock, Calendar, RefreshCw } from "lucide-react";

// Типы данных
interface DomainAnalysisResult {
  domain: string;
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
}

interface StructuredReportTableProps {
  data: DomainAnalysisResult[];
  onSaveReport?: () => void;
}

export function StructuredReportTable({ data, onSaveReport }: StructuredReportTableProps) {
  const [sortField, setSortField] = useState<string>('domain');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState({
    minSnapshots: 0,
    minYears: 0,
    maxAvgInterval: 1000,
    maxGap: 1000,
    minTimemap: 0,
    showRecommended: false,
    showLongLive: false
  });
  
  // Функция для определения стиля строки
  const getRowStyle = (item: DomainAnalysisResult) => {
    const currentYear = new Date().getFullYear();
    const lastSnapshotYear = item.last_snapshot ? new Date(item.last_snapshot).getFullYear() : null;
    
    // Проверка на "long-live" домен
    const isLongLive = 
      (item.total_snapshots !== undefined && item.total_snapshots >= 5) && 
      (item.years_covered !== undefined && item.years_covered >= 3) && 
      (item.avg_interval_days !== undefined && item.avg_interval_days < 90) && 
      (item.max_gap_days !== undefined && item.max_gap_days < 180) && 
      (item.timemap_count !== undefined && item.timemap_count > 200);
    
    // Проверка на последний снимок в текущем году
    const isCurrentYear = lastSnapshotYear === currentYear;
    
    if (isLongLive) {
      return "bg-green-600 text-white hover:bg-green-700";
    } else if (isCurrentYear) {
      return "bg-orange-500 text-white hover:bg-orange-600";
    }
    
    return "hover:bg-gray-100 dark:hover:bg-gray-700";
  };
  
  // Форматирование даты
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };
  
  // Фильтрация данных
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Базовые фильтры по числовым значениям
      if (item.total_snapshots !== undefined && item.total_snapshots < filters.minSnapshots) return false;
      if (item.years_covered !== undefined && item.years_covered < filters.minYears) return false;
      if (item.avg_interval_days !== undefined && item.avg_interval_days > filters.maxAvgInterval) return false;
      if (item.max_gap_days !== undefined && item.max_gap_days > filters.maxGap) return false;
      if (item.timemap_count !== undefined && item.timemap_count < filters.minTimemap) return false;
      
      // Фильтр по рекомендованным
      if (filters.showRecommended && item.recommended !== true) return false;
      
      // Фильтр по long-live
      if (filters.showLongLive) {
        const isLongLive = 
          (item.total_snapshots !== undefined && item.total_snapshots >= 5) && 
          (item.years_covered !== undefined && item.years_covered >= 3) && 
          (item.avg_interval_days !== undefined && item.avg_interval_days < 90) && 
          (item.max_gap_days !== undefined && item.max_gap_days < 180) && 
          (item.timemap_count !== undefined && item.timemap_count > 200);
        
        if (!isLongLive) return false;
      }
      
      return true;
    });
  }, [data, filters]);
  
  // Сортировка данных
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField as keyof DomainAnalysisResult];
      const bValue = b[sortField as keyof DomainAnalysisResult];
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // Для числовых и других типов
      return sortDirection === 'asc' 
        ? (aValue < bValue ? -1 : 1)
        : (bValue < aValue ? -1 : 1);
    });
  }, [filteredData, sortField, sortDirection]);
  
  // Обработчик сортировки
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Обработчик изменения фильтров
  const handleFilterChange = (name: string, value: number | boolean) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Сброс фильтров
  const resetFilters = () => {
    setFilters({
      minSnapshots: 0,
      minYears: 0,
      maxAvgInterval: 1000,
      maxGap: 1000,
      minTimemap: 0,
      showRecommended: false,
      showLongLive: false
    });
  };
  
  // Получение данных из wayback_history_summary
  const getWaybackData = (item: DomainAnalysisResult) => {
    if (!item.wayback_history_summary) return {
      total_snapshots: 0,
      first_snapshot: null,
      last_snapshot: null,
      years_covered: 0,
      avg_interval_days: 0,
      max_gap_days: 0,
      timemap_count: 0
    };
    
    return {
      total_snapshots: item.wayback_history_summary.total_snapshots || 0,
      first_snapshot: item.wayback_history_summary.first_snapshot || null,
      last_snapshot: item.wayback_history_summary.last_snapshot || null,
      years_covered: item.wayback_history_summary.years_covered || 0,
      avg_interval_days: item.wayback_history_summary.avg_interval_days || 0,
      max_gap_days: item.wayback_history_summary.max_gap_days || 0,
      timemap_count: item.wayback_history_summary.timemap_count || 0
    };
  };
  
  if (!data || data.length === 0) {
    return <div className="p-4 text-center text-gray-500">Нет данных для отображения</div>;
  }
  
  return (
    <div className="space-y-4 font-rubik">
      {/* Панель фильтров */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Фильтры</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetFilters} 
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border-0 shadow-md flex items-center gap-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Сбросить
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Мин. снимков</label>
            <Input 
              type="number" 
              value={filters.minSnapshots} 
              onChange={(e) => handleFilterChange('minSnapshots', parseInt(e.target.value) || 0)}
              className="shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-0 text-black dark:text-white dark:bg-gray-700 border-0"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Мин. лет</label>
            <Input 
              type="number" 
              value={filters.minYears} 
              onChange={(e) => handleFilterChange('minYears', parseInt(e.target.value) || 0)}
              className="shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-0 text-black dark:text-white dark:bg-gray-700 border-0"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Макс. интервал (дни)</label>
            <Input 
              type="number" 
              value={filters.maxAvgInterval} 
              onChange={(e) => handleFilterChange('maxAvgInterval', parseInt(e.target.value) || 0)}
              className="shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-0 text-black dark:text-white dark:bg-gray-700 border-0"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Макс. промежуток (дни)</label>
            <Input 
              type="number" 
              value={filters.maxGap} 
              onChange={(e) => handleFilterChange('maxGap', parseInt(e.target.value) || 0)}
              className="shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-0 text-black dark:text-white dark:bg-gray-700 border-0"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Мин. timemap</label>
            <Input 
              type="number" 
              value={filters.minTimemap} 
              onChange={(e) => handleFilterChange('minTimemap', parseInt(e.target.value) || 0)}
              className="shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-0 text-black dark:text-white dark:bg-gray-700 border-0"
            />
          </div>
          <div className="flex items-center space-x-6 mt-8">
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                checked={filters.showRecommended} 
                onChange={(e) => handleFilterChange('showRecommended', e.target.checked)}
                className="rounded shadow-sm w-4 h-4 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-0"
              />
              <span className="text-gray-700 dark:text-gray-300">Только рекомендуемые</span>
            </label>
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                checked={filters.showLongLive} 
                onChange={(e) => handleFilterChange('showLongLive', e.target.checked)}
                className="rounded shadow-sm w-4 h-4 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-0"
              />
              <span className="text-gray-700 dark:text-gray-300">Только long-live</span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Легенда */}
      <div className="flex flex-wrap items-center gap-6 mb-2 p-4 bg-gray-800 rounded-lg shadow-lg">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 bg-green-600 rounded-md shadow-lg mr-2">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-medium text-white">Long-live домены</span>
        </div>
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 bg-orange-500 rounded-md shadow-lg mr-2">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-medium text-white">Последний снимок в текущем году</span>
        </div>
      </div>
      
      {/* Кнопка сохранения отчета */}
      {onSaveReport && (
        <div className="flex justify-end mb-4">
          <Button 
            onClick={onSaveReport} 
            className="bg-green-600 hover:bg-green-700 text-white shadow-lg flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Сохранить отчет
          </Button>
        </div>
      )}
      
      {/* Таблица */}
      <div className="overflow-x-auto rounded-lg shadow-xl">
        <Table className="w-full">
          <TableHeader className="bg-gray-100 dark:bg-gray-800">
            <TableRow className="border-0">
              <TableHead 
                className="cursor-pointer text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border-0"
                onClick={() => handleSort('domain')}
              >
                Домен {sortField === 'domain' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border-0"
                onClick={() => handleSort('total_snapshots')}
              >
                Снимки {sortField === 'total_snapshots' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border-0"
                onClick={() => handleSort('first_snapshot')}
              >
                Первый снимок {sortField === 'first_snapshot' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border-0"
                onClick={() => handleSort('last_snapshot')}
              >
                Последний снимок {sortField === 'last_snapshot' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border-0"
                onClick={() => handleSort('years_covered')}
              >
                Лет {sortField === 'years_covered' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border-0"
                onClick={() => handleSort('avg_interval_days')}
              >
                Ср. интервал {sortField === 'avg_interval_days' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border-0"
                onClick={() => handleSort('max_gap_days')}
              >
                Макс. промежуток {sortField === 'max_gap_days' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border-0"
                onClick={() => handleSort('timemap_count')}
              >
                Timemap {sortField === 'timemap_count' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border-0"
                onClick={() => handleSort('recommended')}
              >
                Рекомендуемый {sortField === 'recommended' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                )}
              </TableHead>
              <TableHead className="text-sm font-bold text-gray-900 dark:text-white border-0">SEO</TableHead>
              <TableHead className="text-sm font-bold text-gray-900 dark:text-white border-0">Тематика</TableHead>
              <TableHead className="text-sm font-bold text-gray-900 dark:text-white border-0">Оценка</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item, index) => {
              // Получаем данные из wayback_history_summary если основные поля пустые
              const waybackData = getWaybackData(item);
              
              return (
                <TableRow key={index} className={`${getRowStyle(item)} border-0`}>
                  <TableCell className="font-semibold border-0">{item.domain}</TableCell>
                  <TableCell className="border-0">{item.total_snapshots || waybackData.total_snapshots || '-'}</TableCell>
                  <TableCell className="border-0">{formatDate(item.first_snapshot || waybackData.first_snapshot)}</TableCell>
                  <TableCell className="border-0">{formatDate(item.last_snapshot || waybackData.last_snapshot)}</TableCell>
                  <TableCell className="border-0">{item.years_covered || waybackData.years_covered || '-'}</TableCell>
                  <TableCell className="border-0">
                    {item.avg_interval_days !== undefined 
                      ? item.avg_interval_days.toFixed(2) 
                      : waybackData.avg_interval_days !== undefined 
                        ? waybackData.avg_interval_days.toFixed(2) 
                        : '-'}
                  </TableCell>
                  <TableCell className="border-0">{item.max_gap_days || waybackData.max_gap_days || '-'}</TableCell>
                  <TableCell className="border-0">{item.timemap_count || waybackData.timemap_count || '-'}</TableCell>
                  <TableCell className="border-0">
                    {item.recommended ? (
                      <Badge className="bg-green-500 text-white hover:bg-green-600 shadow-md">Да</Badge>
                    ) : (
                      <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-300 shadow-md">Нет</Badge>
                    )}
                  </TableCell>
                  <TableCell className="border-0">
                    {item.seo_metrics ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="bg-white dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 shadow-md border-0">Просмотр</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[300px] bg-white dark:bg-gray-800 shadow-xl border-0">
                          <DropdownMenuItem className="flex flex-col items-start">
                            <span className="font-medium mb-1 text-gray-900 dark:text-white">SEO метрики:</span>
                            <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded w-full overflow-x-auto text-gray-800 dark:text-gray-200">
                              {JSON.stringify(item.seo_metrics, null, 2)}
                            </pre>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">Нет данных</span>
                    )}
                  </TableCell>
                  <TableCell className="border-0">
                    {item.thematic_analysis_result ? (
                      item.thematic_analysis_result.error ? (
                        <span className="text-red-500 text-xs">{item.thematic_analysis_result.error}</span>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="bg-white dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 shadow-md border-0">Просмотр</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[300px] bg-white dark:bg-gray-800 shadow-xl border-0">
                            <DropdownMenuItem className="flex flex-col items-start">
                              <span className="font-medium mb-1 text-gray-900 dark:text-white">Тематический анализ:</span>
                              <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded w-full overflow-x-auto text-gray-800 dark:text-gray-200">
                                {JSON.stringify(item.thematic_analysis_result, null, 2)}
                              </pre>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">Нет данных</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-white font-medium border-0">{item.assessment_summary || 'Ожидается'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Информация о количестве записей */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Показано {sortedData.length} из {data.length} доменов
      </div>
    </div>
  );
}
