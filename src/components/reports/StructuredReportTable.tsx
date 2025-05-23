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
import { ChevronDown, ChevronUp, Filter } from "lucide-react";

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
      return "bg-green-50";
    } else if (isCurrentYear) {
      return "bg-orange-50";
    }
    
    return "";
  };
  
  // Форматирование даты
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
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
  
  if (!data || data.length === 0) {
    return <div className="p-4 text-center text-gray-500">Нет данных для отображения</div>;
  }
  
  return (
    <div className="space-y-4">
      {/* Панель фильтров */}
      <div className="bg-gray-50 p-4 rounded-md border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Фильтры</h3>
          <Button variant="outline" size="sm" onClick={resetFilters}>Сбросить</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Мин. снимков</label>
            <Input 
              type="number" 
              value={filters.minSnapshots} 
              onChange={(e) => handleFilterChange('minSnapshots', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Мин. лет</label>
            <Input 
              type="number" 
              value={filters.minYears} 
              onChange={(e) => handleFilterChange('minYears', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Макс. интервал (дни)</label>
            <Input 
              type="number" 
              value={filters.maxAvgInterval} 
              onChange={(e) => handleFilterChange('maxAvgInterval', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Макс. промежуток (дни)</label>
            <Input 
              type="number" 
              value={filters.maxGap} 
              onChange={(e) => handleFilterChange('maxGap', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Мин. timemap</label>
            <Input 
              type="number" 
              value={filters.minTimemap} 
              onChange={(e) => handleFilterChange('minTimemap', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div className="flex items-center space-x-4 mt-6">
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                checked={filters.showRecommended} 
                onChange={(e) => handleFilterChange('showRecommended', e.target.checked)}
                className="rounded"
              />
              <span>Только рекомендуемые</span>
            </label>
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                checked={filters.showLongLive} 
                onChange={(e) => handleFilterChange('showLongLive', e.target.checked)}
                className="rounded"
              />
              <span>Только long-live</span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Легенда */}
      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-50 border border-green-200 mr-2"></div>
          <span className="text-xs">Long-live домены</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-orange-50 border border-orange-200 mr-2"></div>
          <span className="text-xs">Последний снимок в текущем году</span>
        </div>
      </div>
      
      {/* Кнопка сохранения отчета */}
      {onSaveReport && (
        <div className="flex justify-end mb-4">
          <Button onClick={onSaveReport} className="bg-green-600 hover:bg-green-700">
            Сохранить отчет
          </Button>
        </div>
      )}
      
      {/* Таблица */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('domain')}
              >
                Домен {sortField === 'domain' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('total_snapshots')}
              >
                Снимки {sortField === 'total_snapshots' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('first_snapshot')}
              >
                Первый снимок {sortField === 'first_snapshot' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('last_snapshot')}
              >
                Последний снимок {sortField === 'last_snapshot' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('years_covered')}
              >
                Лет {sortField === 'years_covered' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('avg_interval_days')}
              >
                Ср. интервал {sortField === 'avg_interval_days' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('max_gap_days')}
              >
                Макс. промежуток {sortField === 'max_gap_days' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('timemap_count')}
              >
                Timemap {sortField === 'timemap_count' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('recommended')}
              >
                Рекомендуемый {sortField === 'recommended' && (
                  sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                )}
              </TableHead>
              <TableHead>SEO</TableHead>
              <TableHead>Тематика</TableHead>
              <TableHead>Оценка</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item, index) => (
              <TableRow key={index} className={getRowStyle(item)}>
                <TableCell className="font-medium">{item.domain}</TableCell>
                <TableCell>{item.total_snapshots || 'N/A'}</TableCell>
                <TableCell>{formatDate(item.first_snapshot)}</TableCell>
                <TableCell>{formatDate(item.last_snapshot)}</TableCell>
                <TableCell>{item.years_covered || 'N/A'}</TableCell>
                <TableCell>{item.avg_interval_days?.toFixed(2) || 'N/A'}</TableCell>
                <TableCell>{item.max_gap_days || 'N/A'}</TableCell>
                <TableCell>{item.timemap_count || 'N/A'}</TableCell>
                <TableCell>
                  {item.recommended ? (
                    <Badge variant="success">Да</Badge>
                  ) : (
                    <Badge variant="outline">Нет</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {item.seo_metrics ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">Просмотр</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[300px]">
                        <DropdownMenuItem className="flex flex-col items-start">
                          <span className="font-medium mb-1">SEO метрики:</span>
                          <pre className="text-xs bg-gray-50 p-2 rounded w-full overflow-x-auto">
                            {JSON.stringify(item.seo_metrics, null, 2)}
                          </pre>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-gray-400">Нет данных</span>
                  )}
                </TableCell>
                <TableCell>
                  {item.thematic_analysis_result ? (
                    item.thematic_analysis_result.error ? (
                      <span className="text-red-500 text-xs">{item.thematic_analysis_result.error}</span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">Просмотр</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[300px]">
                          <DropdownMenuItem className="flex flex-col items-start">
                            <span className="font-medium mb-1">Тематический анализ:</span>
                            <pre className="text-xs bg-gray-50 p-2 rounded w-full overflow-x-auto">
                              {JSON.stringify(item.thematic_analysis_result, null, 2)}
                            </pre>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )
                  ) : (
                    <span className="text-gray-400">Нет данных</span>
                  )}
                </TableCell>
                <TableCell>
                  {item.assessment_summary || 'Нет данных'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="text-sm text-gray-500 mt-2">
        Показано {sortedData.length} из {data.length} доменов
      </div>
    </div>
  );
}
