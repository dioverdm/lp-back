import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppProvider, { useApp } from './contexts/AppContext';
import Shell from './components/Shell';
import { ToastContainer } from './components/BusinessSwitcher';
import Dashboard  from './pages/Dashboard';
import Inventory  from './pages/Inventory';
import POS        from './pages/POS';
import Invoices   from './pages/Invoices';
import Reports    from './pages/Reports';
import Customers  from './pages/Customers';
import Members    from './pages/Members';
import Settings   from './pages/Settings';
import Catalog    from './pages/Catalog';
import { Login, Register, Onboarding } from './pages/Auth';

function Inner() {
  const { user, loading, init } = useApp();
  useEffect(() => { init(); }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 16 }}>
      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'var(--primary)' }}>⚡ LiquidPOS</div>
      <div className="spinner"></div>
    </div>
  );

  return (
    <>
      <Routes>
        <Route path="/@:slug"     element={<Catalog />} />
        <Route path="/login"      element={!user ? <Login />      : <Navigate to="/" replace />} />
        <Route path="/register"   element={!user ? <Register />   : <Navigate to="/" replace />} />
        <Route path="/onboarding" element={user  ? <Onboarding /> : <Navigate to="/login" replace />} />
        {user ? (
          <Route path="/*" element={
            <Shell>
              <Routes>
                <Route path="/"          element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/inventory/:id" element={<Inventory />} />
                <Route path="/pos"       element={<POS />} />
                <Route path="/invoices"  element={<Invoices />} />
                <Route path="/reports"   element={<Reports />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/members"   element={<Members />} />
                <Route path="/settings"  element={<Settings />} />
                <Route path="*"          element={<Navigate to="/" replace />} />
              </Routes>
            </Shell>
          } />
        ) : (
          <Route path="/*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
      <ToastContainer />
    </>
  );
}

export default function App() {
  return <AppProvider><Inner /></AppProvider>;
}
