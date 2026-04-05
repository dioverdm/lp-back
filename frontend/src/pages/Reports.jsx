import React, { useState, useEffect } from 'react';
import { stats as statsApi } from '../api';
import { useApp } from '../contexts/AppContext';
import { Loading, fmt, fmtNum } from '../components/BusinessSwitcher';

export default function Reports() {
  const { business } = useApp();
  const today    = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [filters, setFilters] = useState({ from: firstDay, to: today });
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    setLoading(true);
    statsApi.reports(filters).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [business, filters]);

  if (loading) return <Loading />;

  const d       = data || {};
  const summary = d.summary || [];
  const daily   = d.daily   || [];
  const byCat   = d.byCategory || [];
  const currency = business?.currency || 'USD';

  const getSummary = (type) => summary.find((s) => s.type === type) || { count: 0, units: 0, total: 0 };
  const sales  = getSummary('SALE');
  const inbound = getSummary('INBOUND');

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Reportes</h1>
          <p>Análisis de ventas e inventario</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '.82rem', color: 'var(--text-secondary)' }}>Desde</span>
          <input type="date" className="filter-select" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
          <span style={{ fontSize: '.82rem', color: 'var(--text-secondary)' }}>Hasta</span>
          <input type="date" className="filter-select" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
        </div>
      </div>

      {/* KPI strip */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { icon: 'fa-money-bill-wave', color: 'var(--success)', label: 'Ingresos', value: fmt(sales.total, currency), sub: `${fmtNum(sales.count)} facturas` },
          { icon: 'fa-boxes-stacked',   color: 'var(--primary)', label: 'Unidades Vendidas', value: fmtNum(sales.units), sub: 'Productos despachados' },
          { icon: 'fa-chart-line',      color: 'var(--info)',    label: 'Ticket Promedio', value: fmt(sales.count ? sales.total / sales.count : 0, currency), sub: 'Por factura' },
          { icon: 'fa-arrow-down',      color: 'var(--warning)', label: 'Entradas Inventario', value: fmtNum(inbound.units), sub: `${fmtNum(inbound.count)} movimientos` },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.color + '15', color: s.color }}><i className={`fa-solid ${s.icon}`}></i></div>
            <div className="stat-body">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Daily table */}
        <div className="card">
          <div className="card-title">Movimientos Diarios</div>
          {daily.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0', fontSize: '.85rem' }}>Sin datos en el período seleccionado</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.78rem' }}>
                <thead>
                  <tr>
                    {['Fecha', 'Ingresos', 'Entradas', 'Salidas'].map((h) => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Fecha' ? 'left' : 'right', color: 'var(--text-secondary)', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {daily.map((row) => (
                    <tr key={row.date} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '7px 8px' }}>{new Date(row.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</td>
                      <td style={{ textAlign: 'right', padding: '7px 8px', fontWeight: 600, color: 'var(--success)' }}>{fmt(row.revenue, currency)}</td>
                      <td style={{ textAlign: 'right', padding: '7px 8px', color: 'var(--info)' }}>{fmtNum(row.inbound)}</td>
                      <td style={{ textAlign: 'right', padding: '7px 8px', color: 'var(--danger)' }}>{fmtNum(row.outbound)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* By category */}
        <div className="card">
          <div className="card-title">Ventas por Categoría</div>
          {byCat.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0', fontSize: '.85rem' }}>Sin datos en el período seleccionado</p>
          ) : byCat.map((c, i) => {
            const maxRev = byCat[0]?.revenue || 1;
            const pct    = Math.round((c.revenue / maxRev) * 100);
            return (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '.82rem' }}>
                  <span style={{ fontWeight: 600 }}>{c.category || 'Sin categoría'}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{fmt(c.revenue, currency)}</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: `hsl(${260 - i * 30}, 80%, 55%)`, borderRadius: 99, transition: 'width .5s ease' }}></div>
                </div>
                <div style={{ fontSize: '.7rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                  {fmtNum(c.units)} unidades · {fmtNum(c.transactions)} mov.
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
