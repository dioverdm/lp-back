import React, { createContext, useContext, useState, useCallback } from 'react';
import { auth as authApi, businesses as bizApi, setToken, setBizId, getToken, getBizId } from '../api';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export default function AppProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [bizList, setBizList]   = useState([]);
  const [business, setBusiness] = useState(null);
  const [toasts, setToasts]     = useState([]);
  const [loading, setLoading]   = useState(true);

  const toast = useCallback((msg, type = 'info', ms = 3000) => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), ms);
  }, []);

  const loadBusinesses = useCallback(async () => {
    try {
      const list = await bizApi.list();
      setBizList(list);
      const storedId = getBizId();
      const found = list.find(b => String(b.id) === String(storedId)) || list[0];
      if (found) { setBusiness(found); setBizId(found.id); }
      return list;
    } catch { return []; }
  }, []);

  const init = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) { setLoading(false); return; }
      const me = await authApi.profile();
      setUser(me);
      await loadBusinesses();
    } catch {
      setToken(null); setBizId(null);
    } finally { setLoading(false); }
  }, [loadBusinesses]);

  const login = useCallback(async (body) => {
    const { token, user: u } = await authApi.login(body);
    setToken(token);
    setUser(u);
    const list = await loadBusinesses();
    return { user: u, businesses: list };
  }, [loadBusinesses]);

  const register = useCallback(async (body) => {
    const { token, user: u } = await authApi.register(body);
    setToken(token);
    setUser(u);
    setBizList([]);
    return u;
  }, []);

  const logout = useCallback(() => {
    setToken(null); setBizId(null);
    setUser(null); setBizList([]); setBusiness(null);
  }, []);

  const switchBiz = useCallback((biz) => {
    setBusiness(biz);
    setBizId(biz.id);
  }, []);

  const refreshBizList = loadBusinesses;

  return (
    <Ctx.Provider value={{ user, setUser, bizList, setBizList, business, switchBiz, refreshBizList, toast, toasts, loading, init, login, register, logout }}>
      {children}
    </Ctx.Provider>
  );
}
