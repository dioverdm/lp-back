import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useApp, useTheme } from '../context/AppContext.jsx';

const ICONS = {
  dashboard:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  pos:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  catalog:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  inventory:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
  orders:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>,
  team:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  settings:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  logout:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  sun:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  menu:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  bell:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
};

function Sidebar({ mobile, open, onClose }) {
  const { state, logout, selectCompany } = useApp();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [showCompanies, setShowCompanies] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {mobile && open && <div className="modal-overlay" style={{ zIndex: 99 }} onClick={onClose} />}
      <aside className={`sidebar ${mobile && open ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">L</div>
            <span className="logo-text">Liquid<span>POS</span></span>
          </div>
        </div>

        <div className="sidebar-company" onClick={() => setShowCompanies(v => !v)}>
          <div className="company-name">{state.company?.name || 'Sin empresa'}</div>
          <div className="company-role">{state.company?.role || '—'}</div>
          {showCompanies && state.companies.length > 1 && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {state.companies.map(c => (
                <div
                  key={c.id}
                  onClick={(e) => { e.stopPropagation(); selectCompany(c); setShowCompanies(false); }}
                  style={{
                    padding: '6px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    background: state.company?.id === c.id ? 'var(--brand-light)' : 'var(--bg-surface)',
                    color: state.company?.id === c.id ? 'var(--brand-dark)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {c.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-title">Principal</span>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={onClose}>
            {ICONS.dashboard} Dashboard
          </NavLink>
          <NavLink to="/pos" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={onClose}>
            {ICONS.pos} Punto de Venta
          </NavLink>

          <span className="nav-section-title">Gestión</span>
          <NavLink to="/catalog" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={onClose}>
            {ICONS.catalog} Catálogo
          </NavLink>
          <NavLink to="/inventory" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={onClose}>
            {ICONS.inventory} Inventario
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={onClose}>
            {ICONS.orders} Pedidos
          </NavLink>

          <span className="nav-section-title">Administración</span>
          <NavLink to="/team" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={onClose}>
            {ICONS.team} Equipo
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={onClose}>
            {ICONS.settings} Configuración
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {theme === 'light' ? ICONS.sun : ICONS.moon}
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {theme === 'light' ? 'Claro' : 'Oscuro'}
              </span>
            </div>
            <button className={`theme-toggle ${theme === 'dark' ? 'active' : ''}`} onClick={toggle} aria-label="Toggle theme">
              <div className="theme-toggle-thumb" />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
            <div className="avatar avatar-sm" style={{ background: 'var(--brand-light)', color: 'var(--brand-dark)' }}>
              {state.user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {state.user?.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {state.user?.email}
              </div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Cerrar sesión">
              {ICONS.logout}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = window.innerWidth <= 768;

  return (
    <div className="app-shell">
      <Sidebar mobile={isMobile} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <header className="topbar">
          {isMobile && (
            <button className="btn btn-ghost btn-icon" onClick={() => setSidebarOpen(true)}>
              {<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost btn-icon" title="Notificaciones">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
          </button>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
