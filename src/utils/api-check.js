// Функция для проверки доступности API
const checkApiAvailability = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}`, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Таймаут для быстрого определения недоступности
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch (error) {
    console.error('API недоступен:', error);
    return false;
  }
};
