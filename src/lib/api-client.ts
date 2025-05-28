/**
 * API клиент для взаимодействия с бэкендом
 * Централизованное место для всех API запросов
 */

// Базовый URL API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://okw04g0os0cocooowskcwg4s.alettidesign.ru/api/v1';

// Интерфейсы для типизации данных
export interface AnalysisTask {
  id: string;
  task_name: string;
  status: string;
  created_at: string;
  completed_at?: string;
  domains_count: number;
  domains: string[];
  results: any[];
  progress: number;
  current_domain?: string;
  error?: string;
}

export interface AnalysisTaskCreate {
  task_name: string;
  domains: string[];
  use_test_data?: boolean;
}

/**
 * Функция для выполнения запросов с обработкой ошибок и редиректов
 */
async function fetchWithErrorHandling(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * API для работы с задачами анализа
 */
export const analysisApi = {
  // Создание новой задачи анализа
  createTask: async (taskData: AnalysisTaskCreate): Promise<AnalysisTask> => {
    return fetchWithErrorHandling(`${API_BASE_URL}/analysis/analyze`, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  // Получение статуса задачи по ID
  getTaskStatus: async (taskId: string): Promise<AnalysisTask> => {
    // Используем правильный путь /analysis/tasks/{taskId}
    return fetchWithErrorHandling(`${API_BASE_URL}/analysis/tasks/${taskId}`);
  },

  // Экспорт отчета
  exportReport: async (reportId: string, format: string = 'json'): Promise<any> => {
    return fetchWithErrorHandling(`${API_BASE_URL}/analysis/export/${reportId}?format=${format}`);
  },

  // Получение списка задач
  listTasks: async (page: number = 1, pageSize: number = 20): Promise<any> => {
    return fetchWithErrorHandling(`${API_BASE_URL}/analysis?page=${page}&page_size=${pageSize}`);
  },
};

/**
 * API для работы с отчетами
 */
export const reportsApi = {
  // Получение списка отчетов
  listReports: async (): Promise<any> => {
    return fetchWithErrorHandling(`${API_BASE_URL}/reports/`);
  },

  // Получение отчета по ID
  getReport: async (reportId: string): Promise<any> => {
    return fetchWithErrorHandling(`${API_BASE_URL}/reports/${reportId}`);
  },
};

export default {
  analysis: analysisApi,
  reports: reportsApi,
};
