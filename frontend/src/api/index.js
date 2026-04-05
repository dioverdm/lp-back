const API = import.meta.env.VITE_API_URL || '/api';

let _token = localStorage.getItem('lp_token');
let _bizId  = localStorage.getItem('lp_biz');

export const setToken  = (t) => { _token = t; t ? localStorage.setItem('lp_token', t) : localStorage.removeItem('lp_token'); };
export const setBizId  = (id) => { _bizId  = id; id ? localStorage.setItem('lp_biz', id)    : localStorage.removeItem('lp_biz'); };
export const getToken  = () => _token;
export const getBizId  = () => _bizId;

async function req(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (_token)  headers['Authorization']  = `Bearer ${_token}`;
  if (_bizId)  headers['X-Business-Id']  = _bizId;

  const res = await fetch(`${API}${endpoint}`, { ...options, headers });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message || 'Error'), { status: res.status, upgrade: data.upgrade });
  return data;
}

const get    = (url, params) => req(url + (params ? '?' + new URLSearchParams(params) : ''));
const post   = (url, body)   => req(url, { method: 'POST',   body: JSON.stringify(body) });
const put    = (url, body)   => req(url, { method: 'PUT',    body: JSON.stringify(body) });
const patch  = (url, body)   => req(url, { method: 'PATCH',  body: JSON.stringify(body) });
const del    = (url)         => req(url, { method: 'DELETE' });

// ── Auth ───────────────────────────────────────────────────────
export const auth = {
  login:    (body) => post('/auth/login', body),
  register: (body) => post('/auth/register', body),
  profile:  ()     => get('/auth/profile'),
  update:   (body) => put('/auth/profile', body),
  password: (body) => put('/auth/password', body),
};

// ── Businesses ─────────────────────────────────────────────────
export const businesses = {
  list:           ()         => get('/businesses'),
  create:         (body)     => post('/businesses', body),
  update:         (id, body) => put(`/businesses/${id}`, body),
  remove:         (id)       => del(`/businesses/${id}`),
  members:        (id)       => get(`/businesses/${id}/members`),
  inviteMember:   (id, body) => post(`/businesses/${id}/members`, body),
  updateMember:   (id, mid, body) => put(`/businesses/${id}/members/${mid}`, body),
  removeMember:   (id, mid)  => del(`/businesses/${id}/members/${mid}`),
};

// ── Products ───────────────────────────────────────────────────
export const products = {
  list:     (params) => get('/products', params),
  get:      (id)     => get(`/products/${id}`),
  barcode:  (code)   => get(`/products/barcode/${encodeURIComponent(code)}`),
  create:   (body)   => post('/products', body),
  update:   (id, b)  => put(`/products/${id}`, b),
  stock:    (id, b)  => patch(`/products/${id}/stock`, b),
  remove:   (id)     => del(`/products/${id}`),
  txns:     (id)     => get(`/products/${id}/transactions`),
};

// ── Invoices ───────────────────────────────────────────────────
export const invoices = {
  list:    (params) => get('/invoices', params),
  get:     (id)     => get(`/invoices/${id}`),
  create:  (body)   => post('/invoices', body),
  status:  (id, s)  => patch(`/invoices/${id}/status`, { status: s }),
  remove:  (id)     => del(`/invoices/${id}`),
};

// ── Misc ───────────────────────────────────────────────────────
export const stats         = { dashboard: ()      => get('/stats/dashboard'),
                                reports: (p)       => get('/stats/reports', p) };
export const warehouses    = { list: ()      => get('/warehouses'),
                                create: (b)   => post('/warehouses', b),
                                update: (i,b) => put(`/warehouses/${i}`, b),
                                remove: (i)   => del(`/warehouses/${i}`) };
export const categories    = { list: ()      => get('/categories'),
                                create: (b)   => post('/categories', b),
                                update: (i,b) => put(`/categories/${i}`, b),
                                remove: (i)   => del(`/categories/${i}`) };
export const discounts     = { list: ()      => get('/discounts'),
                                create: (b)   => post('/discounts', b),
                                update: (i,b) => put(`/discounts/${i}`, b),
                                toggle: (i,v) => put(`/discounts/${i}`, { active: v }),
                                remove: (i)   => del(`/discounts/${i}`) };
export const customers     = { list: (p)     => get('/customers', p),
                                create: (b)   => post('/customers', b),
                                update: (i,b) => put(`/customers/${i}`, b),
                                remove: (i)   => del(`/customers/${i}`) };
export const notifications = { list: ()      => get('/notifications') };
export const transactions  = { list: (p)     => get('/transactions', p) };
export const catalog       = { get: (slug, p) => get(`/catalog/${slug}`, p) };
