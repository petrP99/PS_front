import { bffUrl } from './config';

const API_BASE = '/api/v1';


// Reads a cookie value by name
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

// Adds CSRF token for non-GET requests
  if (options.method && options.method !== 'GET') {
    const csrfToken = getCookie('XSRF-TOKEN');
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken;
    }
  }

  const response = await fetch(bffUrl(`${API_BASE}${endpoint}`), {
    ...options,
    credentials: 'include',
    headers: headers,
  });

  if (response.status === 401) {
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData.message ||
      errorData.detail ||
      errorData.error ||
      `Request failed with status ${response.status}`
    );
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

// Handles empty responses
  const text = await response.text();
  if (!text) {
    return null;
  }
  return JSON.parse(text);
};

export const getProfile = () => apiFetch('/client/profile');

// Cards
export const createCard = ({ name, currency, isPremium, accountId }) =>
  apiFetch('/cards/create', {
    method: 'POST',
    body: JSON.stringify({ name, currency, isPremium, accountId })
  });

export const getCardById = (id) =>
  apiFetch(`/cards/${id}`);

export const blockCard = (id) =>
  apiFetch(`/cards/${id}/block`, {
    method: 'POST'
  });

export const getMyCards = () =>
  apiFetch('/cards/my');

// Replenishments
export const getReplenishments = () =>
  apiFetch('/replenishments/my');

export const getReplenishmentsByAccount = (accountId) =>
  apiFetch(`/replenishments/accounts/${accountId}`);

export const replenishAccount = (accountId, amount) =>
  apiFetch('/replenishments', {
    method: 'POST',
    body: JSON.stringify({ amount, accountId })
  });

// Payments
export const createPayment = ({ accountId, recipient, paymentDestination, amount }) =>
  apiFetch('/payments/create', {
    method: 'POST',
    body: JSON.stringify({ accountId, recipient, paymentDestination, amount })
  });

export const getPayments = () =>
  apiFetch('/payments/my?size=500');

export const getPaymentById = (id) =>
  apiFetch(`/payments/${id}`);

// Accounts
export const getMyAccounts = () =>
  apiFetch('/account/my');

export const getAccountById = (id) =>
  apiFetch(`/account/get/${id}`);

export const createAccount = (currency, name) =>
  apiFetch('/account/create', {
    method: 'POST',
    body: JSON.stringify({ currency, name })
  });

export const closeAccount = (id) =>
  apiFetch(`/account/${id}/close`, {
    method: 'POST'
  });

// Currency rates
export const getCurrencyRates = async () => {
  const response = await apiFetch('/currency/rates');
  return Object.fromEntries(
    response.rates.map(({ currency, rate }) => [currency, rate])
  );
};

// Account transfers
export const previewAccountTransfer = ({ accountFrom, accountTo, amount }) =>
  apiFetch('/account-transfers/preview', {
    method: 'POST',
    body: JSON.stringify({ accountFrom, accountTo, amount })
  });

export const createAccountTransfer = ({ accountFrom, accountTo, amount }) =>
  apiFetch('/account-transfers', {
    method: 'POST',
    body: JSON.stringify({ accountFrom, accountTo, amount })
  });

// Transfers
export const previewTransfer = ({ cardFrom, cardTo, amount, message }) =>
  apiFetch('/transfers/preview', {
    method: 'POST',
    body: JSON.stringify({ cardFrom, cardTo, amount, message })
  });

export const createTransfer = ({ cardFrom, cardTo, amount, message }) =>
  apiFetch('/transfers/create', {
    method: 'POST',
    body: JSON.stringify({ cardFrom, cardTo, amount, message })
  });

export const previewPhoneTransfer = ({ cardFrom, phone, amount, message }) =>
  apiFetch('/transfers/preview-phone', {
    method: 'POST',
    body: JSON.stringify({ cardFrom, phone, amount, message })
  });

export const createPhoneTransfer = ({ cardFrom, phone, amount, message }) =>
  apiFetch('/transfers/create-phone', {
    method: 'POST',
    body: JSON.stringify({ cardFrom, phone, amount, message })
  });

export const getTransferById = (id) =>
  apiFetch(`/transfers/${id}`);

export const getTransferHistory = () =>
  apiFetch('/transfers/my?size=500');

export const getTransferHistoryById = (id) =>
  apiFetch(`/transfers/history/${id}`);

