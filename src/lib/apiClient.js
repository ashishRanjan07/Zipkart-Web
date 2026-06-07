const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION ?? 'v1';
const API_PREFIX = `${BASE_URL}/api/${API_VERSION}`;

// Access token lives in memory — never in localStorage — to reduce XSS exposure.
// Refresh token lives in sessionStorage (cleared when tab closes).
let _accessToken = null;

export const tokenStore = {
  getAccess: () => _accessToken,
  setAccess: (token) => { _accessToken = token; },
  getRefresh: () => sessionStorage.getItem('zk_refresh_token'),
  setRefresh: (token) => sessionStorage.setItem('zk_refresh_token', token),
  clearAll: () => {
    _accessToken = null;
    sessionStorage.removeItem('zk_refresh_token');
    sessionStorage.removeItem('zk_admin_session');
  },
};

export class ApiError extends Error {
  constructor(status, message, errors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

async function attemptTokenRefresh() {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) throw new ApiError(401, 'No refresh token');

  const res = await fetch(`${API_PREFIX}/admin/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    tokenStore.clearAll();
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  const data = await res.json();
  tokenStore.setAccess(data.access_token);
  if (data.refresh_token) tokenStore.setRefresh(data.refresh_token);
  return data.access_token;
}

function buildHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(method, path, { body, params, signal } = {}) {
  const url = new URL(`${API_PREFIX}${path}`);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
  }

  const execute = (token) =>
    fetch(url.toString(), {
      method,
      headers: buildHeaders(token),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal,
    });

  let res = await execute(tokenStore.getAccess());

  if (res.status === 401) {
    try {
      const newToken = await attemptTokenRefresh();
      res = await execute(newToken);
    } catch {
      tokenStore.clearAll();
      // Notify the auth layer so it can redirect to login
      window.dispatchEvent(new CustomEvent('zk:session-expired'));
      throw new ApiError(401, 'Session expired. Please log in again.');
    }
  }

  if (res.status === 204) return null;

  let json = null;
  try { json = await res.json(); } catch { /* no body */ }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json?.message ?? `Request failed: ${res.status}`,
      json?.errors ?? null,
    );
  }

  return json;
}

const api = {
  get:    (path, options)       => request('GET',    path, options),
  post:   (path, body, options) => request('POST',   path, { ...options, body }),
  put:    (path, body, options) => request('PUT',    path, { ...options, body }),
  patch:  (path, body, options) => request('PATCH',  path, { ...options, body }),
  delete: (path, options)       => request('DELETE', path, options),
};

export default api;
