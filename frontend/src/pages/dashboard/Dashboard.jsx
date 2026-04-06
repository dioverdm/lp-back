import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api.js';
import { useApp } from '../../context/AppContext.jsx';

const fmt = (n, currency = 'USD') =>
  new Intl.NumberFormat('es-VE', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n || 0);

const COLORS = ['#1DB954','#CBA258','#3498DB','#E74C3C','#9B59B6'];

function StatCard({ icon, label, value, change, color = 'green', prefix = '' }) {
  return (
    <div className={`stat-card ${color} animate-fade-in`}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div className={`stat-icon ${color}`}>{icon}</div>
      </div>
      <div className="stat-value">{prefix}{typeof value === 'number' ? value.toLocaleString('es-VE') : value}</div>
      <div className="stat-label">{label}</div>
      {change !== undefined && (
        <div className={`stat-change ${change >= 0 ? 'up' : 'down'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs ayer
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding:'10px 14px', minWidth:140 }}>
      <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize:14, fontWeight:700, color: p.color }}>
          {currency ? fmt(p.value) : p.value} {p.name !== 'revenue' ? p.name : ''}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { state } = useApp();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [state.company?.id]);

  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg" /><span>Cargando dashboard…</span></div>;
  if (!data)   return <div className="empty-state"><div className="empty-icon">📊</div><div className="empty-title">Sin datos aún</div></div>;

  const currency = state.company?.currency || 'USD';

  // Rellenar horas faltantes del día
  const hours = Array.from({length:24}, (_,h) => {
    const found = data.hourly?.find(r => Number(r.hour) === h);
    return { hour: `${String(h).padStart(2,'0')}:00`, revenue: found ? Number(found.revenue) : 0, count: found ? Number(found.count) : 0 };
  }).filter(h => h.hour >= '06:00' && h.hour <= '23:00');

  const weekly = (data.weekly || []).map(r => ({
    date: new Date(r.date).toLocaleDateString('es-VE',{weekday:'short',day:'numeric'}),
    revenue: Number(r.revenue),
    orders: Number(r.orders),
  }));

  const payMethods = (data.paymentMethods || []).map(r => ({
    name: { cash:'Efectivo', card:'Tarjeta', transfer:'Transferencia', credit:'Crédito', other:'Otro' }[r.method] || r.method,
    value: Number(r.total),
  }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Bienvenido, {state.user?.name?.split(' ')[0]} 👋 — {state.company?.name}</p>
        </div>
        <div className="page-header-actions">
          <Link to="/pos" className="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            Abrir POS
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
          label="Ventas hoy"
          value={fmt(data.today?.revenue, currency)}
          prefix=""
          color="green"
        />
        <StatCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>}
          label="Pedidos hoy"
          value={data.today?.orders || 0}
          color="blue"
        />
        <StatCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
          label="Ventas del mes"
          value={fmt(data.month?.revenue, currency)}
          prefix=""
          color="gold"
        />
        <StatCard
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>}
          label="Stock bajo"
          value={data.lowStock || 0}
          color="red"
        />
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Ventas de la semana</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly} margin={{ top:5, right:10, bottom:0, left:0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1DB954" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#1DB954" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} width={60} tickFormatter={v => fmt(v, currency).replace(/[^0-9.,]/g,'').slice(0,6)} />
                <Tooltip content={<CustomTooltip currency />} />
                <Area type="monotone" dataKey="revenue" stroke="#1DB954" strokeWidth={2} fill="url(#revGrad)" name="revenue" dot={false} activeDot={{ r:4, fill:'#1DB954' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Métodos de pago</span>
          </div>
          <div className="chart-container" style={{ height:200 }}>
            {payMethods.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={payMethods} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {payMethods.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v, currency)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding:24 }}>
                <div className="empty-icon" style={{ fontSize:32 }}>💳</div>
                <div className="empty-desc">Sin pagos este mes</div>
              </div>
            )}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, padding:'0 4px' }}>
            {payMethods.map((p,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-secondary)' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:COLORS[i], flexShrink:0 }} />
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Ventas por hora (hoy)</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hours} margin={{ top:5, right:10, bottom:0, left:0 }}>
                <XAxis dataKey="hour" tick={{ fontSize:10, fill:'var(--text-muted)' }} axisLine={false} tickLine={false}
                  tickFormatter={h => h.slice(0,5)} interval={2} />
                <YAxis tick={{ fontSize:10, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip currency />} />
                <Bar dataKey="revenue" fill="#1DB954" radius={[4,4,0,0]} name="revenue" maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Top 5 productos</span>
          </div>
          {(data.topProducts || []).length ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {data.topProducts.map((p, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{
                    width:28, height:28, borderRadius:8, background:'var(--brand-light)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:12, fontWeight:800, color:'var(--brand-dark)', flexShrink:0,
                  }}>
                    {i+1}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{Number(p.sold)} vendidos</div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--brand-primary)', fontFamily:'var(--font-mono)', whiteSpace:'nowrap' }}>
                    {fmt(p.revenue, currency)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding:24 }}>
              <div className="empty-icon" style={{ fontSize:28 }}>🛒</div>
              <div className="empty-desc">Aún no hay ventas registradas</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
