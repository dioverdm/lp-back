import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useToast } from '../../context/AppContext.jsx';

const fmt = (n, cur='USD') =>
  new Intl.NumberFormat('es-VE',{style:'currency',currency:cur,minimumFractionDigits:2}).format(n||0);

const STATUS = {
  paid:      { label:'Pagado',    cls:'badge-success' },
  pending:   { label:'Pendiente', cls:'badge-warning' },
  cancelled: { label:'Cancelado', cls:'badge-danger'  },
  draft:     { label:'Borrador',  cls:'badge-neutral'  },
};

function OrderDetail({ orderId, onClose }) {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/pos/orders/${orderId}`).then(setOrder).catch(console.error);
  }, [orderId]);

  if (!order) return (
    <div className="modal-overlay">
      <div className="modal"><div className="loading-screen"><div className="spinner spinner-md"/></div></div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal animate-scale-in" style={{ maxWidth:560 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Pedido {order.order_number}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>
              {new Date(order.created_at).toLocaleString('es-VE')}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {order.customer_name && (
            <div style={{ padding:'10px 14px', background:'var(--bg-surface-2)', borderRadius:'var(--radius-md)' }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{order.customer_name}</div>
              {order.customer_phone && <div style={{ fontSize:12, color:'var(--text-muted)' }}>{order.customer_phone}</div>}
            </div>
          )}

          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
              <tbody>
                {(order.items||[]).map((item,i) => (
                  <tr key={i}>
                    <td style={{ fontSize:13 }}>{item.name}</td>
                    <td style={{ fontFamily:'var(--font-mono)' }}>{item.quantity}</td>
                    <td style={{ fontFamily:'var(--font-mono)' }}>{fmt(item.unit_price)}</td>
                    <td style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>{fmt(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:6, padding:'4px 0' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-secondary)' }}>
              <span>Subtotal</span><span style={{ fontFamily:'var(--font-mono)' }}>{fmt(order.subtotal)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-secondary)' }}>
              <span>IVA</span><span style={{ fontFamily:'var(--font-mono)' }}>{fmt(order.tax_amount)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:18, fontWeight:800, paddingTop:8, borderTop:'1px solid var(--border-color)' }}>
              <span>Total</span>
              <span style={{ fontFamily:'var(--font-mono)', color:'var(--brand-primary)' }}>{fmt(order.total)}</span>
            </div>
          </div>

          {(order.payments||[]).length > 0 && (
            <div>
              <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'var(--text-muted)', marginBottom:8 }}>Pagos</div>
              {order.payments.map((p,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13, padding:'6px 0', borderBottom:'1px solid var(--border-color)' }}>
                  <span style={{ fontWeight:600, textTransform:'capitalize' }}>{p.method}</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders]   = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [status, setStatus]   = useState('');
  const [detail, setDetail]   = useState(null);
  const { toast }             = useToast();
  const LIMIT = 25;

  const fetch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (status) params.set('status', status);
      const data = await api.get(`/pos/orders?${params}`);
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [page, status]);

  const handleCancel = async (id) => {
    if (!confirm('¿Cancelar este pedido?')) return;
    await api.post(`/pos/orders/${id}/cancel`, {});
    toast('Pedido cancelado', 'success');
    fetch();
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Pedidos</h1>
          <p>{total} pedidos registrados</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom:16, padding:14 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[['','Todos'],['paid','Pagados'],['pending','Pendientes'],['cancelled','Cancelados']].map(([v,l]) => (
            <button key={v} className={`btn btn-sm ${status===v?'btn-primary':'btn-secondary'}`} onClick={() => { setStatus(v); setPage(1); }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding:0 }}>
        <div className="table-wrapper" style={{ border:'none', borderRadius:'var(--radius-lg)' }}>
          <table className="data-table">
            <thead>
              <tr><th>Orden</th><th>Fecha</th><th>Cliente</th><th>Origen</th><th>Total</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding:48, textAlign:'center' }}><div className="spinner spinner-md" style={{ margin:'0 auto' }}/></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">🧾</div><div className="empty-title">Sin pedidos</div></div></td></tr>
              ) : orders.map(o => {
                const st = STATUS[o.status] || { label: o.status, cls:'badge-neutral' };
                return (
                  <tr key={o.id} style={{ cursor:'pointer' }} onClick={() => setDetail(o.id)}>
                    <td><span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'var(--brand-primary)' }}>{o.order_number}</span></td>
                    <td style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                      {new Date(o.created_at).toLocaleString('es-VE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                    </td>
                    <td style={{ fontSize:13 }}>{o.customer_name || <span style={{ color:'var(--text-muted)' }}>Consumidor final</span>}</td>
                    <td><span className="badge badge-info" style={{ textTransform:'capitalize' }}>{o.source}</span></td>
                    <td><span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:14 }}>{fmt(o.total)}</span></td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      {o.status === 'pending' && (
                        <button className="btn btn-ghost btn-sm" style={{ color:'var(--color-danger)' }} onClick={() => handleCancel(o.id)}>
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div style={{ display:'flex', justifyContent:'center', gap:8, padding:16, borderTop:'1px solid var(--border-color)' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}>← Anterior</button>
            <span style={{ fontSize:13, color:'var(--text-muted)', alignSelf:'center' }}>Pág {page} de {pages}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p=>Math.min(pages,p+1))} disabled={page===pages}>Siguiente →</button>
          </div>
        )}
      </div>

      {detail && <OrderDetail orderId={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
