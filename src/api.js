const API_BASE = '/api/v1';

export const apiFetch = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Перенаправляем на Keycloak через BFF
    window.location.href = 'http://localhost:9090/oauth2/authorization/keycloak';
    return;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return await response.json();
};

export const getProfile = () => apiFetch('/client/profile');