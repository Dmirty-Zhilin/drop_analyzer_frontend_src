"use client";

import React from 'react';
import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  value: number;
  currentDomain?: string;
  progress?: {
    current: number;
    total: number;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export function AnalysisProgressBar({ value, currentDomain, progress, status }: ProgressBarProps) {
  // Если задача завершена или провалена, не показываем анимацию
  const showAnimation = status !== 'completed' && status !== 'failed';
  
  return (
    <div className="space-y-3">
      {/* Прогресс-бар с анимацией */}
      <div className="w-full">
        <Progress 
          value={value} 
          className="h-2 bg-gray-700" 
          indicatorClassName={`${status === 'failed' ? 'bg-red-500' : 'bg-indigo-500'} transition-all duration-500 ease-in-out`} 
        />
      </div>
      
      {/* Информация о текущем прогрессе */}
      <div className="flex justify-between items-center text-sm text-gray-300">
        <span>
          {currentDomain ? (
            <>Analyzing: <span className="font-mono text-indigo-400">{currentDomain}</span></>
          ) : (
            "Preparing analysis..."
          )}
        </span>
        {progress && (
          <span className="font-medium">
            Progress: {progress.current}/{progress.total} domains
          </span>
        )}
      </div>
      
      {/* Анимированный индикатор загрузки */}
      {showAnimation && (
        <div className="flex justify-center">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-indigo-500 opacity-75 h-3 w-3 animate-bounce"></div>
            <div className="rounded-full bg-indigo-500 opacity-75 h-3 w-3 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="rounded-full bg-indigo-500 opacity-75 h-3 w-3 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
