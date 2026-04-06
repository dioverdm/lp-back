import { Outlet, Link } from 'react-router-dom';
import { useTheme } from '../context/AppContext.jsx';

export default function POSLayout() {
  const { theme, toggle } = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)' }}>
      <header className="topbar" style={{ padding: '0 16px' }}>
        <div className="logo-mark" style={{ gap: 8 }}>
          <div className="logo-icon" style={{ width: 28, height: 28, fontSize: 14 }}>L</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>LiquidPOS</span>
        </div>
        <div style={{ flex: 1 }} />
        <button
          className={`theme-toggle ${theme === 'dark' ? 'active' : ''}`}
          onClick={toggle}
          style={{ marginRight: 8 }}
        >
          <div className="theme-toggle-thumb" />
        </button>
        <Link to="/dashboard" className="btn btn-secondary btn-sm">
          ← Dashboard
        </Link>
      </header>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Outlet />
      </div>
    </div>
  );
}
