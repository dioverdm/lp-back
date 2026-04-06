import { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import api, { setToken, setCompanyId, clearAuth } from '../services/api.js';

/* ── Auth/App Context ─────────────────────────────── */
const AppContext = createContext(null);

const init = {
  user:      null,
  company:   null,
  companies: [],
  token:     localStorage.getItem('access_token'),
  loading:   true,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SESSION': return { ...state, ...action.payload, loading: false };
    case 'SET_COMPANY': return { ...state, company: action.payload };
    case 'SET_LOADING': return { ...state, loading: action.value };
    case 'LOGOUT':
      clearAuth();
      return { ...init, token: null, loading: false };
    default: return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, init);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { dispatch({ type: 'SET_LOADING', value: false }); return; }
    setToken(token);
    const cid = localStorage.getItem('company_id');
    if (cid) setCompanyId(cid);

    api.get('/auth/me').then(data => {
      dispatch({ type: 'SET_SESSION', payload: {
        user: data.user, companies: data.companies, token,
        company: cid ? data.companies.find(c => String(c.id) === cid) || data.companies[0] : data.companies[0],
      }});
      if (!cid && data.companies[0]) setCompanyId(data.companies[0].id);
    }).catch(() => dispatch({ type: 'LOGOUT' }));
  }, []);

  const selectCompany = useCallback((company) => {
    setCompanyId(company.id);
    dispatch({ type: 'SET_COMPANY', payload: company });
  }, []);

  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);

  return (
    <AppContext.Provider value={{ state, dispatch, selectCompany, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

/* ── Theme Context ────────────────────────────────── */
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

/* ── Toast Context ────────────────────────────────── */
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now();
    setToasts(ts => [...ts, { id, message, type }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), duration);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : 'ℹ'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/* ── Cart Context ─────────────────────────────────── */
const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const idx = state.items.findIndex(i =>
        i.product_id === action.item.product_id && i.variant_id === action.item.variant_id
      );
      if (idx >= 0) {
        const items = [...state.items];
        items[idx] = { ...items[idx], quantity: items[idx].quantity + 1 };
        return { ...state, items };
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: 1 }] };
    }
    case 'REMOVE': return { ...state, items: state.items.filter((_, i) => i !== action.index) };
    case 'UPDATE_QTY': {
      if (action.qty <= 0) return { ...state, items: state.items.filter((_, i) => i !== action.index) };
      return { ...state, items: state.items.map((it, i) => i === action.index ? { ...it, quantity: action.qty } : it) };
    }
    case 'SET_CUSTOMER': return { ...state, customer: action.customer };
    case 'SET_DISCOUNT': return { ...state, discount: Number(action.discount) };
    case 'CLEAR': return { items: [], discount: 0, customer: null };
    default: return state;
  }
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, { items: [], discount: 0, customer: null });

  const taxRate  = 16;
  const subtotal = cart.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const tax      = cart.items.reduce((s, i) => {
    const r = i.tax_rate ?? taxRate;
    return s + (i.unit_price * i.quantity * r / 100);
  }, 0);
  const total    = subtotal + tax - (cart.discount || 0);

  return (
    <CartContext.Provider value={{ cart, dispatch, subtotal, tax, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
