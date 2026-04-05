import React, { useState, useEffect, useCallback, useRef } from 'react';
import { products as pApi, invoices as invApi, customers as custApi } from '../api';
import { useApp } from '../contexts/AppContext';
import { Modal, fmt } from '../components/BusinessSwitcher';

export default function POS() {
  const { business, toast } = useApp();
  const [productSearch, setProductSearch] = useState('');
  const [productList, setProductList] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustSearch, setShowCustSearch] = useState(false);
  const [payMethod, setPayMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [discGlobal, setDiscGlobal] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [scanMode, setScanMode] = useState(false);
  const scanRef = useRef();

  const searchProducts = useCallback(async (q) => {
    if (!q || !business) return;
    try { const r = await pApi.list({ search: q, limit: 20 }); setProductList(r.products || []); } catch {}
  }, [business]);

  useEffect(() => {
    const t = setTimeout(() => searchProducts(productSearch), 300);
    return () => clearTimeout(t);
  }, [productSearch, searchProducts]);

  useEffect(() => {
    if (!business) return;
    pApi.list({ limit: 30 }).then(r => setProductList(r.products || [])).catch(() => {});
  }, [business]);

  const searchCustomers = async (q) => {
    if (!q) { setCustomerResults([]); return; }
    try { const r = await custApi.list({ search: q }); setCustomerResults(r); } catch {}
  };

  useEffect(() => {
    const t = setTimeout(() => searchCustomers(customerSearch), 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  const addToCart = (product) => {
    if (product.stock <= 0) { toast('Sin stock disponible', 'error'); return; }
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) { toast('Stock máximo alcanzado', 'warning'); return prev; }
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1, unitPrice: product.price }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) { setCart(p => p.filter(i => i.id !== id)); return; }
    const product = cart.find(i => i.id === id);
    if (qty > product.stock) { toast('Stock insuficiente', 'warning'); return; }
    setCart(p => p.map(i => i.id === id ? { ...i, qty } : i));
  };

  const updatePrice = (id, price) => setCart(p => p.map(i => i.id === id ? { ...i, unitPrice: parseFloat(price) || 0 } : i));

  const clearCart = () => { setCart([]); setCustomer(null); setCustomerSearch(''); setDiscGlobal(''); setNotes(''); };

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const discAmt  = discGlobal ? subtotal * (parseFloat(discGlobal) / 100) : 0;
  const taxable  = subtotal - discAmt;
  const taxRate  = business?.taxRate || 0;
  const taxAmt   = taxable * (taxRate / 100);
  const total    = taxable + taxAmt;
  const currency = business?.currency || 'USD';

  const handleScan = async (code) => {
    if (!code) return;
    try { const p = await pApi.barcode(code); addToCart(p); setProductSearch(''); }
    catch { toast(`Código "${code}" no encontrado`, 'error'); }
  };

  const submit = async (status = 'paid') => {
    if (!cart.length) { toast('El carrito está vacío', 'error'); return; }
    setSaving(true);
    try {
      const inv = await invApi.create({
        customerId: customer?.id,
        customerName: customer?.name,
        customerEmail: customer?.email,
        items: cart.map(i => ({ productId: i.id, quantity: i.qty, unitPrice: i.unitPrice })),
        paymentMethod: payMethod,
        notes,
        discountGlobal: parseFloat(discGlobal) || 0,
        status,
      });
      setLastInvoice(inv);
      clearCart();
      toast(status === 'paid' ? 'Factura generada ✓' : 'Borrador guardado', 'success');
    } catch (e) { toast(e.message, 'error'); } finally { setSaving(false); }
  };

  return (
    <div className="pos-layout">
      {/* Left: products */}
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div className="search-input-wrap" style={{ flex: 1 }}>
            <i className="fa-solid fa-search"></i>
            <input placeholder="Buscar producto..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
          </div>
          <button className={`btn ${scanMode ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setScanMode(!scanMode); setTimeout(() => scanRef.current?.focus(), 100); }}>
            <i className="fa-solid fa-barcode"></i>
          </button>
        </div>

        {scanMode && (
          <div className="card" style={{ marginBottom: 14, padding: 12 }}>
            <div style={{ fontSize: '.82rem', fontWeight: 600, marginBottom: 8, color: 'var(--primary)' }}><i className="fa-solid fa-barcode"></i> Modo escáner activo</div>
            <input ref={scanRef} className="form-control" placeholder="Escanea el código de barras..." onKeyDown={e => { if (e.key === 'Enter') { handleScan(e.target.value); e.target.value = ''; } }} autoFocus />
          </div>
        )}

        <div className="products-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {productList.map(p => (
            <div key={p.id} className="card card-sm" style={{ cursor: p.stock > 0 ? 'pointer' : 'not-allowed', opacity: p.stock === 0 ? .5 : 1, transition: 'var(--transition)' }} onClick={() => p.stock > 0 && addToCart(p)}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg)', overflow: 'hidden', flexShrink: 0 }}>
                  {p.image_url ? <img src={p.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-image" style={{ color: 'var(--border)', display: 'block', lineHeight: '44px', textAlign: 'center' }}></i>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)' }}>{p.stock} en stock</div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '.88rem' }}>{fmt(p.price, currency)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: cart */}
      <div className="pos-cart">
        <div className="pos-cart-header">
          <span className="pos-cart-title"><i className="fa-solid fa-shopping-cart"></i> Carrito ({cart.length})</span>
          {cart.length > 0 && <button style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '.78rem', cursor: 'pointer' }} onClick={clearCart}>Limpiar</button>}
        </div>

        {/* Customer */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
          {customer ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--primary-bg)', borderRadius: 8, padding: '6px 10px' }}>
              <i className="fa-solid fa-user" style={{ color: 'var(--primary)', fontSize: '.8rem' }}></i>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '.82rem' }}>{customer.name}</div>
                <div style={{ fontSize: '.7rem', color: 'var(--text-secondary)' }}>{customer.email || customer.phone || 'Sin contacto'}</div>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setCustomer(null)}><i className="fa-solid fa-xmark"></i></button>
            </div>
          ) : (
            <div>
              <input className="form-control" style={{ fontSize: '.82rem', padding: '6px 10px' }} placeholder="🔍 Buscar cliente..." value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); setShowCustSearch(true); }} onFocus={() => setShowCustSearch(true)} />
              {showCustSearch && customerResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, zIndex: 10, boxShadow: 'var(--shadow)' }}>
                  {customerResults.slice(0, 5).map(c => (
                    <button key={c.id} onClick={() => { setCustomer(c); setCustomerSearch(''); setShowCustSearch(false); setCustomerResults([]); }} style={{ width: '100%', background: 'none', border: 'none', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', fontSize: '.82rem' }}>
                      <strong>{c.name}</strong> · {c.email || c.phone || '—'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart items */}
        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <i className="fa-solid fa-cart-plus" style={{ fontSize: '2.5rem', opacity: .2, display: 'block', marginBottom: 10 }}></i>
              <p style={{ fontSize: '.85rem' }}>Agrega productos al carrito</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-img">
                {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /> : <i className="fa-solid fa-image" style={{ color: 'var(--border)', fontSize: '.9rem' }}></i>}
              </div>
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name}</div>
                <input type="number" step="0.01" value={item.unitPrice} onChange={e => updatePrice(item.id, e.target.value)} style={{ width: '80px', padding: '2px 6px', border: '1px solid var(--border)', borderRadius: 6, fontSize: '.78rem', color: 'var(--primary)', fontWeight: 700 }} />
              </div>
              <div className="cart-item-qty">
                <button className="qty-btn" onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                <span className="qty-val">{item.qty}</span>
                <button className="qty-btn" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="pos-cart-footer">
            <div className="pos-total-row"><span>Subtotal</span><span>{fmt(subtotal, currency)}</span></div>
            {discGlobal && <div className="pos-total-row" style={{ color: 'var(--success)' }}><span>Descuento ({discGlobal}%)</span><span>−{fmt(discAmt, currency)}</span></div>}
            {taxRate > 0 && <div className="pos-total-row"><span>{business?.taxLabel || 'IVA'} ({taxRate}%)</span><span>{fmt(taxAmt, currency)}</span></div>}
            <div className="pos-total-final"><span>TOTAL</span><span>{fmt(total, currency)}</span></div>

            <div className="form-group">
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {[['cash','fa-money-bill','Efectivo'],['card','fa-credit-card','Tarjeta'],['transfer','fa-building-columns','Transfer']].map(([v,i,l]) => (
                  <button key={v} onClick={() => setPayMethod(v)} style={{ flex: 1, padding: '6px 4px', borderRadius: 8, border: payMethod === v ? '2px solid var(--primary)' : '2px solid var(--border)', background: payMethod === v ? 'var(--primary-bg)' : 'none', fontSize: '.72rem', fontWeight: 600, color: payMethod === v ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer' }}>
                    <i className={`fa-solid ${i}`} style={{ display: 'block', fontSize: '1rem', marginBottom: 2 }}></i>{l}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="form-control" placeholder="Descuento %" type="number" value={discGlobal} onChange={e => setDiscGlobal(e.target.value)} style={{ flex: 1, padding: '6px 10px', fontSize: '.82rem' }} />
                <input className="form-control" placeholder="Nota..." value={notes} onChange={e => setNotes(e.target.value)} style={{ flex: 2, padding: '6px 10px', fontSize: '.82rem' }} />
              </div>
            </div>

            <button className="btn btn-primary btn-block btn-lg" onClick={() => submit('paid')} disabled={saving} style={{ marginBottom: 6 }}>
              <i className="fa-solid fa-check"></i> {saving ? 'Procesando...' : `Cobrar ${fmt(total, currency)}`}
            </button>
            <button className="btn btn-outline btn-block btn-sm" onClick={() => submit('pending')} disabled={saving}>
              <i className="fa-solid fa-clock"></i> Guardar como pendiente
            </button>
          </div>
        )}
      </div>

      {/* Invoice receipt modal */}
      {lastInvoice && <InvoiceReceipt invoice={lastInvoice} currency={currency} onClose={() => setLastInvoice(null)} />}
    </div>
  );
}

function InvoiceReceipt({ invoice, currency, onClose }) {
  const print = () => window.print();
  const i = invoice;
  return (
    <Modal open onClose={onClose} title="Factura Generada" size="modal-sm"
      footer={<><button className="btn btn-outline no-print" onClick={onClose}>Cerrar</button><button className="btn btn-primary no-print" onClick={print}><i className="fa-solid fa-print"></i> Imprimir</button></>}>
      <div className="invoice-print" style={{ fontFamily: 'monospace', fontSize: '.82rem' }}>
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <strong style={{ fontSize: '1rem' }}>{i.businessName}</strong><br />
          Factura {i.invoice_number}<br />
          {new Date(i.created_at).toLocaleString('es-ES')}
        </div>
        <hr />
        <div><strong>Cliente:</strong> {i.customer_name}</div>
        <hr />
        {(i.items || []).map((it, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{it.quantity}x {it.name}</span>
            <span>{fmt(it.subtotal, currency)}</span>
          </div>
        ))}
        <hr />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{fmt(i.subtotal, currency)}</span></div>
        {i.tax_amount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{i.tax_label}</span><span>{fmt(i.tax_amount, currency)}</span></div>}
        <hr />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem' }}><span>TOTAL</span><span>{fmt(i.total, currency)}</span></div>
        <div style={{ textAlign: 'center', marginTop: 10, color: 'var(--text-secondary)', fontSize: '.72rem' }}>Método: {i.payment_method?.toUpperCase()}<br />¡Gracias por su compra!</div>
      </div>
    </Modal>
  );
}
