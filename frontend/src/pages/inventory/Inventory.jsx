import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useToast } from '../../context/AppContext.jsx';

function AdjustModal({ product, branches, onClose, onSave }) {
  const [form, setForm] = useState({ branch_id: branches[0]?.id || '', quantity:'', reason:'', type:'adjustment' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await onSave({ ...form, product_id: product.id }); onClose(); }
    catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal animate-scale-in">
        <div className="modal-header">
          <span className="modal-title">Ajustar Stock</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ padding:'10px 14px', background:'var(--bg-surface-2)', borderRadius:'var(--radius-md)', marginBottom:4 }}>
              <div style={{ fontWeight:700, fontSize:14 }}>{product.name}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>Stock actual: {product.quantity}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Sucursal</label>
              <select className="form-select" value={form.branch_id} onChange={e=>setForm(f=>({...f,branch_id:e.target.value}))}>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tipo de ajuste</label>
              <select className="form-select" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                <option value="adjustment">Ajuste manual</option>
                <option value="in">Entrada de mercancía</option>
                <option value="out">Salida / Baja</option>
                <option value="return">Devolución</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cantidad (+ entrada / - salida)</label>
              <input className="form-input" type="number" value={form.quantity}
                onChange={e=>setForm(f=>({...f,quantity:e.target.value}))}
                placeholder="Ej: 10 (entrada) o -5 (salida)" required />
            </div>
            <div className="form-group">
              <label className="form-label">Motivo</label>
              <input className="form-input" value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))}
                placeholder="Ej: Inventario físico, merma, etc." required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner spinner-sm" /> : 'Aplicar ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [stock, setStock]       = useState([]);
  const [movements, setMov]     = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('stock'); // stock | movements
  const [lowOnly, setLowOnly]   = useState(false);
  const [search, setSearch]     = useState('');
  const [adjusting, setAdjusting] = useState(null);
  const { toast }               = useToast();

  const fetchStock = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (lowOnly) params.set('low_stock','true');
      const [s, b] = await Promise.all([
        api.get(`/inventory/stock?${params}`),
        api.get('/users/branches'),
      ]);
      setStock(s || []);
      setBranches(b || []);
    } catch (err) { toast(err.message,'error'); }
    finally { setLoading(false); }
  };

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const m = await api.get('/inventory/movements?limit=100');
      setMov(m || []);
    } catch (err) { toast(err.message,'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (tab === 'stock') fetchStock(); else fetchMovements(); }, [tab, lowOnly]);

  const handleAdjust = async (form) => {
    await api.post('/inventory/adjust', form);
    toast('Stock ajustado correctamente', 'success');
    fetchStock();
  };

  const filtered = stock.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.sku||'').includes(search));

  const TYPE_LABELS = { in:'Entrada', out:'Salida', adjustment:'Ajuste', sale:'Venta', purchase:'Compra', return:'Devolución', transfer:'Transferencia' };
  const TYPE_COLORS = { in:'badge-success', out:'badge-danger', adjustment:'badge-info', sale:'badge-neutral', purchase:'badge-success', return:'badge-warning' };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Inventario</h1>
          <p>Control de stock y movimientos</p>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {['stock','movements'].map(t => (
          <button key={t} className={`btn ${tab===t?'btn-primary':'btn-secondary'}`} onClick={() => setTab(t)}>
            {t==='stock' ? '📦 Stock actual' : '📋 Movimientos'}
          </button>
        ))}
      </div>

      {tab === 'stock' && (
        <>
          <div className="card" style={{ marginBottom:16, padding:14 }}>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
              <div className="search-input-wrap" style={{ flex:1, minWidth:200, position:'relative' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input className="form-input" placeholder="Buscar producto..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:38 }} />
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'var(--text-secondary)', whiteSpace:'nowrap' }}>
                <input type="checkbox" checked={lowOnly} onChange={e=>setLowOnly(e.target.checked)} />
                Solo stock bajo
              </label>
            </div>
          </div>

          <div className="card" style={{ padding:0 }}>
            <div className="table-wrapper" style={{ border:'none', borderRadius:'var(--radius-lg)' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Producto</th><th>SKU</th><th>Sucursal</th><th>Stock</th><th>Mín</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ padding:48, textAlign:'center' }}><div className="spinner spinner-md" style={{ margin:'0 auto' }}/></td></tr>
                  ) : filtered.map((s,i) => {
                    const qty = Number(s.quantity);
                    const min = Number(s.min_stock);
                    const status = qty <= 0 ? 'stock-zero' : qty <= min ? 'stock-low' : 'stock-ok';
                    return (
                      <tr key={i}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:32, height:32, borderRadius:8, background:'var(--bg-surface-3)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                              {s.image_url ? <img src={s.image_url} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : '📦'}
                            </div>
                            <span style={{ fontWeight:600, fontSize:13 }}>{s.name}</span>
                          </div>
                        </td>
                        <td><span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-muted)' }}>{s.sku||'—'}</span></td>
                        <td><span style={{ fontSize:12 }}>{s.branch_name}</span></td>
                        <td>
                          <div className={`stock-indicator ${status}`}>
                            <div className="stock-dot" />
                            <span style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>{qty}</span>
                          </div>
                        </td>
                        <td><span style={{ fontSize:12, color:'var(--text-muted)' }}>{min}</span></td>
                        <td>
                          <span className={`badge ${qty<=0?'badge-danger':qty<=min?'badge-warning':'badge-success'}`}>
                            {qty<=0?'Sin stock':qty<=min?'Stock bajo':'OK'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => setAdjusting(s)}>
                            ± Ajustar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">📦</div><div className="empty-title">Sin resultados</div></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'movements' && (
        <div className="card" style={{ padding:0 }}>
          <div className="table-wrapper" style={{ border:'none', borderRadius:'var(--radius-lg)' }}>
            <table className="data-table">
              <thead>
                <tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Antes→Después</th><th>Usuario</th><th>Motivo</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding:48, textAlign:'center' }}><div className="spinner spinner-md" style={{ margin:'0 auto' }}/></td></tr>
                ) : movements.map((m,i) => (
                  <tr key={i}>
                    <td style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{new Date(m.created_at).toLocaleString('es-VE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                    <td style={{ fontSize:13, fontWeight:600 }}>{m.product_name}</td>
                    <td><span className={`badge ${TYPE_COLORS[m.type]||'badge-neutral'}`}>{TYPE_LABELS[m.type]||m.type}</span></td>
                    <td>
                      <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color: Number(m.quantity)>0?'var(--brand-primary)':'var(--color-danger)' }}>
                        {Number(m.quantity)>0?'+':''}{m.quantity}
                      </span>
                    </td>
                    <td style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-muted)' }}>
                      {m.quantity_before} → {m.quantity_after}
                    </td>
                    <td style={{ fontSize:12 }}>{m.user_name}</td>
                    <td style={{ fontSize:12, color:'var(--text-muted)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.reason||'—'}</td>
                  </tr>
                ))}
                {!loading && movements.length===0 && (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">Sin movimientos</div></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {adjusting && (
        <AdjustModal
          product={adjusting}
          branches={branches}
          onClose={() => setAdjusting(null)}
          onSave={handleAdjust}
        />
      )}
    </div>
  );
}
