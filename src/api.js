const API_BASE = '/api/v1';
const CSRF_HEADER = 'X-XSRF-TOKEN';

// Получение CSRF-токена из cookie
const getCsrfToken = () => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
};

export const apiFetch = async (endpoint, options = {}, isRetry = false) => {
  const csrfToken = getCsrfToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Добавляем CSRF-токен только для изменяющих запросов
  if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase())) {
    headers[CSRF_HEADER] = csrfToken;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: headers,
  });

  if (response.status === 401) {
    // Не делаем редирект здесь — это должно обрабатываться на уровне компонентов
    throw new Error('Unauthorized');
  }

  if (response.status === 403 && !isRetry) {
    // Попробуем получить новый CSRF-токен (только один раз)
    await fetch(`${API_BASE}/csrf`, { credentials: 'include' });
    return apiFetch(endpoint, options, true);
  }
  
  if (response.status === 403) {
    throw new Error('Доступ запрещён. Пожалуйста, обновите страницу.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  // Обработка пустых ответов (например, 201 Created или 204 No Content)
  const text = await response.text();
  if (!text) {
    return null;
  }
  return JSON.parse(text);
};

export const getProfile = () => apiFetch('/client/profile');

// Карты
export const createCard = (name, currency = 'RUB') => 
  apiFetch('/cards/create', {
    method: 'POST',
    body: JSON.stringify({ name, currency })
  });

export const getCardById = (id) => 
  apiFetch(`/cards/${id}`);

export const blockCard = (id) => 
  apiFetch(`/cards/${id}/block`, {
    method: 'PUT'
  });

export const getMyCards = () => 
  apiFetch('/cards/my');