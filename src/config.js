const trimTrailingSlash = (value) => value?.replace(/\/+$/, '');

export const BFF_BASE_URL = trimTrailingSlash(import.meta.env.VITE_BFF_BASE_URL) || '';

export const bffUrl = (path) => `${BFF_BASE_URL}${path}`;

export const bffWsUrl = (path) => {
  const baseUrl = BFF_BASE_URL || window.location.origin;
  const url = new URL(path, baseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
};
