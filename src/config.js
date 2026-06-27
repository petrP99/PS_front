const trimTrailingSlash = (value) => value?.replace(/\/+$/, '');

export const BFF_BASE_URL = trimTrailingSlash(import.meta.env.VITE_BFF_BASE_URL) || '';

export const bffUrl = (path) => `${BFF_BASE_URL}${path}`;