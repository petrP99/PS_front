async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  const response = await fetch(url, config);
  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(errorText || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}