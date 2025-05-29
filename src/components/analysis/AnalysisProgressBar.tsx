// Компонент AnalysisProgressBar.tsx (v 0.3)
import React, { useEffect, useState } from 'react';
import { Progress, Box, Text, Flex } from '@chakra-ui/react';

interface AnalysisProgressBarProps {
  progress: number;
  status: string;
  currentDomain?: string;
  results: any[];
}

const AnalysisProgressBar: React.FC<AnalysisProgressBarProps> = ({ 
  progress, 
  status, 
  currentDomain,
  results = []
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [displayStatus, setDisplayStatus] = useState('');
  
  // Анимация прогресс-бара для плавного заполнения
  useEffect(() => {
    // Если задача завершена, устанавливаем 100%
    if (status === 'completed') {
      setDisplayValue(100);
      setDisplayStatus('Анализ завершен');
      return;
    }
    
    // Если задача в процессе, анимируем прогресс
    if (status === 'in_progress') {
      // Если progress = 0, показываем минимальный прогресс
      const targetValue = progress > 0 ? progress : 5;
      
      // Плавная анимация
      const timer = setInterval(() => {
        setDisplayValue(prev => {
          if (prev < targetValue) {
            return prev + 1;
          }
          clearInterval(timer);
          return prev;
        });
      }, 30);
      
      setDisplayStatus(currentDomain 
        ? `Анализ в процессе: ${currentDomain}`
        : 'Анализ в процессе');
      
      return () => clearInterval(timer);
    }
    
    // Для других статусов
    if (status === 'pending') {
      setDisplayValue(0);
      setDisplayStatus('Ожидание начала анализа');
    } else if (status === 'failed') {
      setDisplayValue(0);
      setDisplayStatus('Ошибка анализа');
    } else {
      setDisplayValue(0);
      setDisplayStatus('Неизвестный статус');
    }
  }, [progress, status, currentDomain]);

  return (
    <Box width="100%" mb={4}>
      <Flex justify="space-between" mb={2}>
        <Text>{displayStatus}</Text>
        <Text>{displayValue}%</Text>
      </Flex>
      <Progress 
        value={displayValue} 
        size="md" 
        colorScheme={status === 'failed' ? 'red' : 'blue'} 
        isIndeterminate={status === 'in_progress' && !currentDomain} 
        borderRadius="md"
      />
      {results.length > 0 && (
        <Box mt={4}>
          <Text fontWeight="bold">Обработанные домены ({results.length}):</Text>
          <Box maxH="200px" overflowY="auto" mt={2} p={2} borderWidth="1px" borderRadius="md">
            {results.map((result, index) => (
              <Text key={index} fontSize="sm">
                {result.domain_name || result.domain}: {result.availability_ts ? 'Доступен' : 'Недоступен'}
              </Text>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AnalysisProgressBar;
