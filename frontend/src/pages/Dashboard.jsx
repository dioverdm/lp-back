import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { stats as statsApi } from '../api';
import { useApp } from '../contexts/AppContext';
import { Loading, fmt, fmtNum } from '../components/BusinessSwitcher';

export default function Dashboard() {
  const { business, user } = useApp();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) { setLoading(false); return; }
    setLoading(true);
    statsApi.dashboard().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [business]);

  if (!business) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏢</div>
      <h2 style={{ marginBottom: '8px' }}>Bienvenido, {user?.name}</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Crea tu primera empresa para comenzar</p>
      <button className="btn btn-primary btn-lg" onClick={() => navigate('/onboarding')}>
        <i className="fa-solid fa-plus"></i> Crear mi empresa
      </button>
    </div>
  );

  if (loading) return <Loading />;

  const d = data || {};
  const p = d.products || {};
  const s = d.sales || {};
  const a = d.alerts || {};
  const currency = business?.currency || 'USD';

  const quickActions = [
    { label: 'Facturar', icon: 'fa-cash-register', path: '/pos', color: 'var(--primary)' },
    { label: 'Inventario', icon: 'fa-box', path: '/inventory', color: 'var(--info)' },
    { label: 'Productos', icon: 'fa-plus', path: '/inventory/new', color: 'var(--success)' },
    { label: 'Reportes', icon: 'fa-chart-bar', path: '/reports', color: 'var(--warning)' },
  ];

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '1.4rem' }}>
          Buenos días, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          {business?.name} · {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '24px' }}>
        {quickActions.map(q => (
          <button key={q.path} onClick={() => navigate(q.path)} className="card" style={{ cursor: 'pointer', textAlign: 'center', padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', border: 'none', transition: 'var(--transition)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: q.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`fa-solid ${q.icon}`} style={{ color: q.color }}></i>
            </div>
            <span style={{ fontSize: '.78rem', fontWeight: 600 }}>{q.label}</span>
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <StatCard icon="fa-boxes-stacked" color="var(--primary)" label="Valor Inventario" value={fmt(p.inventoryValue, currency)} sub={`${fmtNum(p.stock)} unidades`} />
        <StatCard icon="fa-money-bill-wave" color="var(--success)" label="Ventas de Hoy" value={fmt(s.today, currency)} sub={`${fmtNum(s.todayUnits)} unidades vendidas`} />
        <StatCard icon="fa-chart-line" color="var(--info)" label="Ventas del Mes" value={fmt(s.month, currency)} sub="Ingresos acumulados" />
        <StatCard icon="fa-triangle-exclamation" color="var(--warning)" label="Alertas Stock" value={a.lowStock + a.outOfStock} sub={`${a.outOfStock} agotados · ${a.lowStock} bajos`} warn={a.lowStock + a.outOfStock > 0} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Top products */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 className="card-title" style={{ marginBottom: 0 }}>Top Productos</h3>
            <span style={{ fontSize: '.75rem', color: 'var(--text-secondary)' }}>Este mes</span>
          </div>
          {(d.topProducts || []).length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '.85rem', textAlign: 'center', padding: '20px' }}>Sin ventas registradas</p>
          ) : (
            (d.topProducts || []).map((pr, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 20, fontWeight: 700, color: 'var(--text-secondary)', fontSize: '.78rem' }}>#{i + 1}</span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg)', overflow: 'hidden', flexShrink: 0 }}>
                  {pr.image_url ? <img src={pr.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-image" style={{ color: 'var(--border)', fontSize: '.9rem', margin: 'auto', display: 'block', lineHeight: '34px', textAlign: 'center' }}></i>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pr.name}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)' }}>{fmtNum(pr.sold)} vendidos</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--primary)' }}>{fmt(pr.revenue, currency)}</div>
              </div>
            ))
          )}
        </div>

        {/* Recent activity */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 className="card-title" style={{ marginBottom: 0 }}>Actividad Reciente</h3>
            <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/invoices')}>Ver todo</button>
          </div>
          {(d.recentTransactions || []).length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '.85rem', textAlign: 'center', padding: '20px' }}>Sin actividad reciente</p>
          ) : (
            (d.recentTransactions || []).slice(0, 6).map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.type === 'SALE' ? 'var(--primary-bg)' : t.type === 'INBOUND' ? 'var(--success-bg)' : 'var(--warning-bg)', flexShrink: 0 }}>
                  <i className={`fa-solid ${t.type === 'SALE' ? 'fa-shopping-cart' : t.type === 'INBOUND' ? 'fa-arrow-down' : 'fa-sliders'}`} style={{ fontSize: '.8rem', color: t.type === 'SALE' ? 'var(--primary)' : t.type === 'INBOUND' ? 'var(--success)' : 'var(--warning)' }}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.productName}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)' }}>{new Date(t.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '.82rem' }}>{t.type === 'SALE' ? fmt(t.total, currency) : `${t.quantity} uds`}</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--text-secondary)' }}>{t.createdByName}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Low stock alert strip */}
      {(a.lowStock > 0 || a.outOfStock > 0) && (
        <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--warning)' }}></i>
            <div>
              <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{a.outOfStock} productos agotados · {a.lowStock} con bajo stock</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>Revisa tu inventario para no perder ventas</div>
            </div>
          </div>
          <button className="btn btn-warning btn-sm" onClick={() => navigate('/inventory?filter=lowStock')} style={{ background: 'var(--warning)', color: 'white', flexShrink: 0 }}>
            Ver inventario
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, color, label, value, sub, warn }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color + '15', color }}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ color: warn ? 'var(--warning)' : undefined }}>{value}</div>
        <div className="stat-sub">{sub}</div>
      </div>
    </div>
  );
}
