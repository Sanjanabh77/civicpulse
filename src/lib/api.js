import { mockRequest } from './mockData.js';

export const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// api('/map/reports', { params: { bbox } })  |  api('/x', { method: 'POST', body: {...} })
export async function api(path, { method = 'GET', body, params } = {}) {
  if (USE_MOCK) return mockRequest(path, { method, body, params });
  const url = new URL(BASE + path);
  if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && v !== null && v !== '' && url.searchParams.set(k, v));
  const token = localStorage.getItem('accessToken');
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.message || res.statusText), { status: res.status });
  }
  return res.status === 204 ? null : res.json();
}
