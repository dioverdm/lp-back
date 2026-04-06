const BASE = import.meta.env.VITE_API_URL || '/api';

let _companyId = localStorage.getItem('company_id');
let _token     = localStorage.getItem('access_token');

export const setToken     = (t) => { _token = t; localStorage.setItem('access_token', t); };
export const setCompanyId = (id) => { _companyId = id; localStorage.setItem('company_id', String(id)); };
export const clearAuth    = () => {
  _token = null; _companyId = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('company_id');
};

async function request(method, path, data, raw = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (_token)     headers['Authorization']  = `Bearer ${_token}`;
  if (_companyId) headers['X-Company-Id']   = _companyId;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (res.status === 401) {
    // Try refresh
    const rt = localStorage.getItem('refresh_token');
    if (rt) {
      const refreshRes = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (refreshRes.ok) {
        const { accessToken, refreshToken } = await refreshRes.json();
        setToken(accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        headers['Authorization'] = `Bearer ${accessToken}`;
        const retry = await fetch(`${BASE}${path}`, { method, headers, body: data ? JSON.stringify(data) : undefined });
        return raw ? retry : retry.json();
      }
    }
    clearAuth();
    window.location.href = '/login';
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error de red' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return raw ? res : res.json();
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, data)  => request('POST',   path, data),
  put:    (path, data)  => request('PUT',    path, data),
  delete: (path)        => request('DELETE', path),
  patch:  (path, data)  => request('PATCH',  path, data),
};

export default api;
