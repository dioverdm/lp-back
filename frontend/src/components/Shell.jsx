import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { notifications as nApi } from '../api';
import BusinessSwitcher from './BusinessSwitcher';

const NAV = [
  { path: '/',           icon: 'fa-solid fa-house',        label: 'Inicio',      section: null },
  { path: '/inventory',  icon: 'fa-solid fa-box',           label: 'Inventario',  section: null },
  { path: '/pos',        icon: 'fa-solid fa-cash-register', label: 'Facturar',    section: null },
  { path: '/invoices',   icon: 'fa-solid fa-file-invoice',  label: 'Facturas',    section: null },
  { path: '/customers',  icon: 'fa-solid fa-users',         label: 'Clientes',    section: 'Gestión' },
  { path: '/reports',    icon: 'fa-solid fa-chart-bar',     label: 'Reportes',    section: 'Gestión' },
  { path: '/settings',   icon: 'fa-solid fa-gear',          label: 'Ajustes',     section: 'Sistema' },
  { path: '/members',    icon: 'fa-solid fa-user-group',    label: 'Equipo',      section: 'Sistema' },
];

const BOTTOM_NAV = [
  { path: '/',          icon: 'fa-solid fa-house',         label: 'Inicio'    },
  { path: '/inventory', icon: 'fa-solid fa-box',            label: 'Inventario' },
  { path: '/pos',       icon: 'fa-solid fa-cash-register',  label: 'Facturar'  },
  { path: '/invoices',  icon: 'fa-solid fa-file-invoice',   label: 'Facturas'  },
  { path: '/settings',  icon: 'fa-solid fa-gear',           label: 'Ajustes'   },
];

export default function Shell({ children }) {
  const { user, business, bizList, switchBiz, logout, refreshBizList } = useApp();
  const navigate = useNavigate();
  const loc      = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [bizOpen, setBizOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!business) return;
    nApi.list().then(setNotifs).catch(() => {});
    const iv = setInterval(() => nApi.list().then(setNotifs).catch(() => {}), 60000);
    return () => clearInterval(iv);
  }, [business]);

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [loc.pathname]);

  const isActive = (p) => p === '/' ? loc.pathname === '/' : loc.pathname.startsWith(p);
  const alerts   = notifs.filter(n => n.type !== 'success');
  const pageTitle = NAV.find(n => isActive(n.path))?.label || 'LiquidPOS';

  const renderNav = (items) => {
    let lastSection = undefined;
    return items.map(item => {
      const section = item.section !== lastSection ? (lastSection = item.section) : null;
      return (
        <React.Fragment key={item.path}>
          {section && <div className="sidebar-section-label">{section}</div>}
          <button className={`nav-link ${isActive(item.path) ? 'active' : ''}`} onClick={() => navigate(item.path)}>
            <i className={`nav-icon ${item.icon}`}></i>
            {item.label}
          </button>
        </React.Fragment>
      );
    });
  };

  return (
    <div className="app-shell">
      {/* Sidebar overlay (mobile) */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <i className="fa-solid fa-bolt" style={{ color: 'var(--primary)', fontSize: '1.4rem' }}></i>
          <span>LiquidPOS</span>
        </div>

        <div className="sidebar-biz" style={{ position: 'relative' }}>
          <div className="sidebar-biz-label">Empresa activa</div>
          {business ? (
            <button className="biz-selector" onClick={() => setBizOpen(!bizOpen)}>
              <div className="biz-avatar">{business.name[0].toUpperCase()}</div>
              <div>
                <div className="biz-name">{business.name}</div>
                <div className="biz-role">{business.role || 'owner'}</div>
              </div>
              <i className={`biz-chevron fa-solid fa-chevron-${bizOpen ? 'up' : 'down'}`}></i>
            </button>
          ) : (
            <button className="biz-selector" onClick={() => navigate('/onboarding')}>
              <div className="biz-avatar" style={{ background: '#e5e7eb', color: '#6b7280' }}>+</div>
              <div className="biz-name" style={{ color: 'var(--text-secondary)' }}>Crear empresa</div>
            </button>
          )}
          {bizOpen && <BusinessSwitcher bizList={bizList} current={business} onSwitch={(b) => { switchBiz(b); setBizOpen(false); }} onNew={() => { setBizOpen(false); navigate('/onboarding'); }} onRefresh={refreshBizList} />}
        </div>

        <nav className="sidebar-nav">{renderNav(NAV)}</nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-plan">{user?.plan || 'free'}</div>
            </div>
            <button className="sidebar-logout" title="Cerrar sesión" onClick={logout}><i className="fa-solid fa-right-from-bracket"></i></button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="app-content">
        {/* Desktop topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-title">{pageTitle}</span>
          </div>
          <div className="topbar-right">
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button className="icon-btn" onClick={() => setNotifOpen(!notifOpen)}>
                <i className="fa-solid fa-bell"></i>
                {alerts.length > 0 && <span className="dot"></span>}
              </button>
              {notifOpen && (
                <div className="notif-panel">
                  <div className="notif-header"><h4>Notificaciones</h4><span className="badge badge-purple">{notifs.length}</span></div>
                  <div className="notif-list">
                    {notifs.map(n => (
                      <div key={n.id} className="notif-item" onClick={() => { if (n.productId) navigate(`/inventory/${n.productId}`); setNotifOpen(false); }}>
                        <div className="notif-dot" style={{ background: n.type === 'error' ? 'var(--danger)' : n.type === 'warning' ? 'var(--warning)' : 'var(--success)' }}></div>
                        <div className="notif-body"><div className="notif-title">{n.title}</div><div className="notif-msg">{n.message}</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className="icon-btn" onClick={() => navigate('/settings')}><i className="fa-solid fa-gear"></i></button>
          </div>
        </header>

        {/* Mobile header */}
        <header className="mobile-header">
          <div className="mobile-header-logo">
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.1rem', padding: '4px' }}>
              <i className="fa-solid fa-bars"></i>
            </button>
            <span>{pageTitle}</span>
          </div>
          <div className="mobile-header-actions">
            <button className="icon-btn" onClick={() => setNotifOpen(!notifOpen)} style={{ position: 'relative' }}>
              <i className="fa-solid fa-bell"></i>
              {alerts.length > 0 && <span className="dot"></span>}
            </button>
          </div>
        </header>

        <main className="page-content">{children}</main>

        {/* Bottom nav (mobile) */}
        <nav className="bottom-nav">
          <div className="bottom-nav-inner">
            {BOTTOM_NAV.map(item => (
              <button key={item.path} className={`bnav-item ${isActive(item.path) ? 'active' : ''}`} onClick={() => navigate(item.path)}>
                <i className={item.icon}></i>
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
