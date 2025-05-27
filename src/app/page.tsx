// Исправленный код для обработки статуса задачи и отображения прогресса
// Этот код должен быть интегрирован в компонент страницы (page.tsx)

// Функция для опроса статуса задачи с корректной обработкой прогресса
const pollTaskStatus = async (taskId: string) => {
  try {
    setIsLoading(true);
    
    // Используем только правильный эндпоинт, который возвращает 200 OK
    const response = await fetch(`${API_BASE_URL}/api/v1/analysis/${taskId}`);
    
    if (!response.ok) {
      throw new Error(`Ошибка при получении статуса задачи: ${response.status}`);
    }
    
    const taskData = await response.json();
    
    // Обработка статуса задачи
    const status = taskData.status || 'pending';
    setTaskStatus(status);
    
    // Расчет прогресса на основе количества обработанных доменов
    const totalDomains = taskData.domains?.length || 0;
    const processedDomains = taskData.results?.length || 0;
    
    // Вычисляем процент выполнения
    let progressPercent = 0;
    if (totalDomains > 0) {
      progressPercent = (processedDomains / totalDomains) * 100;
    }
    
    // Если задача завершена, устанавливаем 100%
    if (status === 'completed') {
      progressPercent = 100;
    }
    
    setProgressValue(progressPercent);
    
    // Сохраняем промежуточные результаты для отображения в реальном времени
    if (taskData.results && taskData.results.length > 0) {
      setPartialResults(taskData.results);
    }
    
    // Если задача завершена, получаем полные результаты
    if (status === 'completed') {
      setTaskReport(taskData);
      setIsLoading(false);
    } else {
      // Задача все еще выполняется, продолжаем опрос через 2 секунды
      setTimeout(() => pollTaskStatus(taskId), 2000);
    }
  } catch (error) {
    console.error('Ошибка при получении статуса задачи:', error);
    setError(`Ошибка при получении статуса задачи: ${error.message}`);
    setIsLoading(false);
  }
};

// В JSX компоненте страницы:
{isLoading && !taskReport && (
  <Box mt={6}>
    <Heading as="h3" size="md" mb={4}>
      Анализ доменов
    </Heading>
    <AnalysisProgressBar 
      value={progressValue} 
      status={taskStatus}
      domains={taskDomains}
      results={partialResults}
      isLoading={isLoading}
    />
  </Box>
)}
