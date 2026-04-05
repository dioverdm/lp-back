import React, { useState, useEffect, useCallback } from 'react';
import { invoices as invApi } from '../api';
import { useApp } from '../contexts/AppContext';
import { Empty, Loading, fmt, Modal } from '../components/BusinessSwitcher';

const STATUS_LABEL = { draft: 'Borrador', pending: 'Pendiente', paid: 'Pagado', cancelled: 'Cancelado', refunded: 'Reembolsado' };
const STATUS_CLASS  = { draft: 'badge-gray', pending: 'badge-warning', paid: 'badge-success', cancelled: 'badge-danger', refunded: 'badge-info' };

export default function Invoices() {
  const { business, toast } = useApp();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '', from: '', to: '' });
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    try {
      const r = await invApi.list({ ...filters, page, limit: 50 });
      setItems(r.invoices || []);
      setTotal(r.total || 0);
    } catch { toast('Error al cargar facturas', 'error'); }
    finally { setLoading(false); }
  }, [business, filters, page]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try { await invApi.status(id, status); toast('Estado actualizado', 'success'); load(); setSelected(null); }
    catch (e) { toast(e.message, 'error'); }
  };

  const totals = items.reduce((acc, inv) => {
    if (inv.status === 'paid') acc.paid += inv.total;
    if (inv.status === 'pending') acc.pending += inv.total;
    return acc;
  }, { paid: 0, pending: 0 });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Facturas</h1>
          <p>{total} facturas · Cobrado: {fmt(totals.paid, business?.currency)} · Pendiente: {fmt(totals.pending, business?.currency)}</p>
        </div>
        <div className="page-header-actions">
          <a href="/pos" className="btn btn-primary"><i className="fa-solid fa-plus"></i> Nueva Factura</a>
        </div>
      </div>

      {/* Filters */}
      <div className="search-bar" style={{ marginBottom: 16 }}>
        <div className="search-input-wrap" style={{ maxWidth: 280 }}>
          <i className="fa-solid fa-search"></i>
          <input placeholder="Número o cliente..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
        </div>
        <select className="filter-select" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input type="date" className="filter-select" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} style={{ paddingLeft: 8 }} />
        <input type="date" className="filter-select" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} style={{ paddingLeft: 8 }} />
        <button className="btn btn-outline btn-sm" onClick={() => setFilters({ status: '', search: '', from: '', to: '' })}>Limpiar</button>
      </div>

      {loading ? <Loading /> : items.length === 0 ? (
        <Empty icon="fa-file-invoice" title="Sin facturas" desc="Las facturas creadas desde el POS aparecerán aquí" />
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Número</th><th>Cliente</th><th>Fecha</th><th>Método</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {items.map(inv => (
                <tr key={inv.id}>
                  <td><strong style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{inv.invoice_number}</strong></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{inv.customer_name}</div>
                    {inv.customer_email && <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)' }}>{inv.customer_email}</div>}
                  </td>
                  <td style={{ fontSize: '.82rem', color: 'var(--text-secondary)' }}>{new Date(inv.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td><span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{inv.payment_method}</span></td>
                  <td><strong style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{fmt(inv.total, business?.currency)}</strong></td>
                  <td><span className={`badge ${STATUS_CLASS[inv.status]}`}>{STATUS_LABEL[inv.status]}</span></td>
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-sm btn-outline" onClick={() => setSelected(inv)}><i className="fa-solid fa-eye"></i></button>
                      {inv.status === 'pending' && <button className="btn btn-sm btn-success" onClick={() => updateStatus(inv.id, 'paid')}><i className="fa-solid fa-check"></i> Cobrar</button>}
                      {['draft','pending'].includes(inv.status) && <button className="btn btn-sm btn-danger" onClick={() => updateStatus(inv.id, 'cancelled')}><i className="fa-solid fa-ban"></i></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <InvoiceDetail invoice={selected} currency={business?.currency} onClose={() => setSelected(null)} onStatusChange={(s) => updateStatus(selected.id, s)} onRefresh={load} />}
    </div>
  );
}

function InvoiceDetail({ invoice: inv, currency, onClose, onStatusChange }) {
  const [detail, setDetail] = useState(inv);
  useEffect(() => { invApi.get(inv.id).then(setDetail).catch(() => {}); }, [inv.id]);
  const print = () => window.print();

  return (
    <Modal open onClose={onClose} title={`Factura ${detail.invoice_number}`} size="modal-lg"
      footer={<>
        <button className="btn btn-outline no-print" onClick={onClose}>Cerrar</button>
        {detail.status === 'pending' && <button className="btn btn-success no-print" onClick={() => onStatusChange('paid')}><i className="fa-solid fa-check"></i> Marcar Pagado</button>}
        {['draft','pending'].includes(detail.status) && <button className="btn btn-danger no-print" onClick={() => onStatusChange('cancelled')}><i className="fa-solid fa-ban"></i> Cancelar</button>}
        <button className="btn btn-primary no-print" onClick={print}><i className="fa-solid fa-print"></i> Imprimir</button>
      </>}>
      <div className="invoice-print">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '1.2rem' }}>{detail.businessName}</div>
            {detail.businessAddress && <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>{detail.businessAddress}</div>}
            {detail.businessPhone && <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>{detail.businessPhone}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.4rem', color: 'var(--primary)' }}>{detail.invoice_number}</div>
            <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>{new Date(detail.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <span className={`badge ${STATUS_CLASS[detail.status]}`} style={{ marginTop: 4 }}>{STATUS_LABEL[detail.status]}</span>
          </div>
        </div>

        {/* Customer */}
        <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>Cliente</div>
          <div style={{ fontWeight: 600 }}>{detail.customer_name}</div>
          {detail.customer_email && <div style={{ fontSize: '.82rem', color: 'var(--text-secondary)' }}>{detail.customer_email}</div>}
          {detail.customer_phone && <div style={{ fontSize: '.82rem', color: 'var(--text-secondary)' }}>{detail.customer_phone}</div>}
          {detail.customer_tax_id && <div style={{ fontSize: '.82rem', color: 'var(--text-secondary)' }}>ID Fiscal: {detail.customer_tax_id}</div>}
        </div>

        {/* Items */}
        <div className="table-wrap" style={{ marginBottom: 16 }}>
          <table>
            <thead><tr><th>Producto</th><th style={{ textAlign: 'right' }}>Precio</th><th style={{ textAlign: 'right' }}>Cant.</th><th style={{ textAlign: 'right' }}>Subtotal</th></tr></thead>
            <tbody>
              {(detail.items || []).map((it, i) => (
                <tr key={i}>
                  <td>{it.name}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(it.unit_price, currency)}</td>
                  <td style={{ textAlign: 'right' }}>{it.quantity}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(it.subtotal, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 240 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '.88rem' }}><span>Subtotal</span><span>{fmt(detail.subtotal, currency)}</span></div>
            {detail.discount_amount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '.88rem', color: 'var(--success)' }}><span>Descuento</span><span>−{fmt(detail.discount_amount, currency)}</span></div>}
            {detail.tax_amount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '.88rem' }}><span>{detail.tax_label || 'IVA'}</span><span>{fmt(detail.tax_amount, currency)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', fontFamily: 'Space Grotesk, sans-serif', borderTop: '2px solid var(--border)', paddingTop: 8, marginTop: 8 }}><span>TOTAL</span><span style={{ color: 'var(--primary)' }}>{fmt(detail.total, currency)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '.8rem', color: 'var(--text-secondary)' }}><span>Método de pago</span><span style={{ textTransform: 'capitalize' }}>{detail.payment_method}</span></div>
          </div>
        </div>

        {detail.notes && <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, fontSize: '.82rem', color: 'var(--text-secondary)' }}><strong>Nota:</strong> {detail.notes}</div>}
      </div>
    </Modal>
  );
}
