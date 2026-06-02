const API_BASE = '/api/v1';


// Функция для получения значения куки по имени
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

export const apiFetch = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: headers,
  });

  // Если метод не GET, добавляем CSRF-токен
  if (options.method && options.method !== 'GET') {
    const csrfToken = getCookie('XSRF-TOKEN');
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken;
    }
  }

  if (response.status === 401) {
    throw new Error('Unauthorized');
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
    method: 'GET'
  });

export const getMyCards = () =>
  apiFetch('/cards/my');