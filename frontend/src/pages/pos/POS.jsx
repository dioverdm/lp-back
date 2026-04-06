import { useEffect, useState, useRef, useCallback } from 'react';
import api from '../../services/api.js';
import { useCart, useApp, useToast } from '../../context/AppContext.jsx';

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

const EMOJI_MAP = {
  'bebidas':'☕', 'comidas':'🍔', 'postres':'🍰', 'snacks':'🥨',
  'default':'📦',
};
function productEmoji(cat) {
  const k = (cat || '').toLowerCase();
  return Object.entries(EMOJI_MAP).find(([key]) => k.includes(key))?.[1] || EMOJI_MAP.default;
}

/* ── Payment Modal ────────────────────────────────── */
function PaymentModal({ total, onClose, onPay }) {
  const [method, setMethod] = useState('cash');
  const [cash, setCash]     = useState('');
  const [ref, setRef]       = useState('');
  const [loading, setLoading] = useState(false);

  const change = method === 'cash' && cash ? Math.max(0, Number(cash) - total) : 0;

  const methods = [
    { id:'cash',     label:'Efectivo',      icon:'💵' },
    { id:'card',     label:'Tarjeta',       icon:'💳' },
    { id:'transfer', label:'Transferencia', icon:'🏦' },
    { id:'credit',   label:'Crédito',       icon:'📝' },
  ];

  const handlePay = async () => {
    setLoading(true);
    try {
      await onPay([{ method, amount: total, reference: ref || null }]);
      onClose();
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-scale-in">
        <div className="modal-header">
          <span className="modal-title">Procesar Pago</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:4 }}>Total a cobrar</div>
            <div style={{ fontSize:36, fontWeight:800, color:'var(--brand-primary)', fontFamily:'var(--font-mono)' }}>{fmt(total)}</div>
          </div>
          <div className="payment-methods">
            {methods.map(m => (
              <div key={m.id} className={`payment-method-btn ${method === m.id ? 'selected' : ''}`} onClick={() => setMethod(m.id)}>
                <span style={{ fontSize:24 }}>{m.icon}</span>
                <span>{m.label}</span>
              </div>
            ))}
          </div>
          {method === 'cash' && (
            <div className="form-group">
              <label className="form-label">Monto recibido</label>
              <input className="form-input" type="number" step="0.01" placeholder="0.00"
                value={cash} onChange={e => setCash(e.target.value)} autoFocus />
              {change > 0 && (
                <div style={{ marginTop:8, padding:'10px 14px', background:'var(--color-success-bg)', borderRadius:'var(--radius-md)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:13, fontWeight:600, color:'var(--brand-dark)' }}>Vuelto</span>
                  <span style={{ fontSize:18, fontWeight:800, color:'var(--brand-dark)', fontFamily:'var(--font-mono)' }}>{fmt(change)}</span>
                </div>
              )}
            </div>
          )}
          {(method === 'card' || method === 'transfer') && (
            <div className="form-group">
              <label className="form-label">Referencia / Últimos 4 dígitos</label>
              <input className="form-input" placeholder="0000" value={ref} onChange={e => setRef(e.target.value)} />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handlePay} disabled={loading}>
            {loading ? <div className="spinner spinner-sm" /> : '✓ Confirmar Pago'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main POS ─────────────────────────────────────── */
export default function POS() {
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch]       = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [branches, setBranches]   = useState([]);
  const [branchId, setBranchId]   = useState(null);
  const [cartOpen, setCartOpen]   = useState(false); // mobile

  const { cart, dispatch, subtotal, tax, total } = useCart();
  const { state } = useApp();
  const { toast } = useToast();
  const searchRef = useRef(null);
  const bufRef    = useRef('');
  const lastKey   = useRef(0);

  useEffect(() => {
    Promise.all([
      api.get('/catalog/products?limit=200&active=true'),
      api.get('/catalog/categories'),
      api.get('/users/branches'),
    ]).then(([p, c, b]) => {
      setProducts(p.products || []);
      setCategories(c || []);
      const br = b || [];
      setBranches(br);
      if (br[0]) setBranchId(br[0].id);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [state.company?.id]);

  // Global barcode scanner (USB laser)
  useEffect(() => {
    const onKey = (e) => {
      if (document.activeElement?.dataset?.scannerInput === 'true') return;
      const now = Date.now();
      if (now - lastKey.current > 300) bufRef.current = '';
      lastKey.current = now;
      if (e.key === 'Enter') {
        const code = bufRef.current.trim();
        bufRef.current = '';
        if (code.length >= 3) handleBarcodeResult(code);
      } else if (e.key.length === 1) {
        bufRef.current += e.key;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [products]);

  const handleBarcodeResult = useCallback((code) => {
    const prod = products.find(p => p.barcode === code || p.sku === code);
    if (prod) addToCart(prod);
    else toast(`Código "${code}" no encontrado`, 'warning');
  }, [products]);

  // Search debounce
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const results = await api.get(`/catalog/products/search?q=${encodeURIComponent(search)}`);
        setSearchResults(results || []);
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const addToCart = (product) => {
    dispatch({ type:'ADD', item: {
      product_id: product.id,
      variant_id: null,
      name:       product.name,
      unit_price: Number(product.price),
      tax_rate:   Number(product.tax_rate ?? 16),
      image_url:  product.image_url,
    }});
    if (window.innerWidth <= 768) setCartOpen(true);
  };

  const filtered = activeCat === 'all'
    ? products
    : products.filter(p => p.category_id && String(p.category_id) === activeCat);

  const handleCheckout = async (payments) => {
    if (!cart.items.length) { toast('El carrito está vacío', 'warning'); return; }
    const payload = {
      branch_id: branchId || branches[0]?.id,
      items: cart.items.map(i => ({
        product_id: i.product_id,
        variant_id: i.variant_id,
        quantity:   i.quantity,
        unit_price: i.unit_price,
        tax_rate:   i.tax_rate,
      })),
      payments,
      source: 'pos',
    };
    const result = await api.post('/pos/orders', payload);
    dispatch({ type:'CLEAR' });
    setCartOpen(false);
    toast(`✓ Pedido ${result.orderNumber} procesado — ${fmt(result.total)}`, 'success');
  };

  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg" /></div>;

  return (
    <>
      <div className="pos-layout">
        {/* ── LEFT: Products ─────────────────────────── */}
        <div className="pos-products">
          {/* Search bar */}
          <div className="pos-search-bar" style={{ background:'var(--bg-surface)' }}>
            <div className="search-input-wrap" style={{ flex:1, position:'relative' }} ref={searchRef}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="form-input"
                placeholder="Buscar por nombre, SKU o código de barras..."
                value={search}
                onChange={e => { setSearch(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 150)}
                data-scanner-input="true"
                style={{ paddingLeft:38 }}
              />
              {showSearch && searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map(p => (
                    <div key={p.id} className="search-result-item" onMouseDown={() => { addToCart(p); setSearch(''); }}>
                      <div style={{ width:36, height:36, borderRadius:8, background:'var(--bg-surface-3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                        {p.image_url ? <img src={p.image_url} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:8 }} /> : productEmoji(p.category_name)}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600 }}>{p.name}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{p.sku || p.barcode || '—'}</div>
                      </div>
                      <div style={{ fontSize:14, fontWeight:700, color:'var(--brand-primary)', fontFamily:'var(--font-mono)' }}>{fmt(p.price)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Branch selector */}
            {branches.length > 1 && (
              <select className="form-select" style={{ width:140 }} value={branchId || ''} onChange={e => setBranchId(Number(e.target.value))}>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
          </div>

          {/* Category tabs */}
          <div className="category-tabs" style={{ paddingTop:12 }}>
            <div className={`category-tab ${activeCat === 'all' ? 'active' : ''}`} onClick={() => setActiveCat('all')}>
              Todos ({products.length})
            </div>
            {categories.map(c => (
              <div key={c.id} className={`category-tab ${activeCat === String(c.id) ? 'active' : ''}`} onClick={() => setActiveCat(String(c.id))}>
                {c.name}
              </div>
            ))}
          </div>

          {/* Products Grid */}
          <div className="products-grid">
            {filtered.map(p => (
              <div key={p.id} className="product-card-pos" onClick={() => addToCart(p)}>
                <div className="product-img">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} />
                    : <span style={{ fontSize:36 }}>{productEmoji(p.category_name)}</span>
                  }
                </div>
                <div className="product-card-pos-body">
                  <div className="product-card-pos-name">{p.name}</div>
                  <div className="product-card-pos-price">{fmt(p.price)}</div>
                  {Number(p.stock) <= 5 && Number(p.stock) > 0 && (
                    <div className="product-stock-low">⚠ Stock: {p.stock}</div>
                  )}
                  {Number(p.stock) === 0 && (
                    <div className="product-stock-low">✕ Sin stock</div>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="empty-state" style={{ gridColumn:'1/-1' }}>
                <div className="empty-icon">🔍</div>
                <div className="empty-title">Sin productos</div>
                <div className="empty-desc">No se encontraron productos en esta categoría</div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Cart ──────────────────────────────── */}
        <div className={`pos-cart ${cartOpen ? 'open' : ''}`}>
          <div className="cart-header">
            <div className="cart-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              Carrito
              {cart.items.length > 0 && <span className="cart-count">{cart.items.reduce((s,i) => s + i.quantity, 0)}</span>}
            </div>
            {cart.items.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type:'CLEAR' })} style={{ color:'var(--color-danger)' }}>
                Vaciar
              </button>
            )}
          </div>

          <div className="cart-items">
            {cart.items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🛒</div>
                <div className="empty-title">Carrito vacío</div>
                <div className="empty-desc">Toca un producto para agregarlo</div>
              </div>
            ) : (
              cart.items.map((item, idx) => (
                <div key={idx} className="cart-item">
                  <div style={{ width:36, height:36, borderRadius:8, background:'var(--bg-surface-3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                    {item.image_url ? <img src={item.image_url} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:8 }} /> : '📦'}
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">{fmt(item.unit_price)} c/u</div>
                  </div>
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => dispatch({ type:'UPDATE_QTY', index:idx, qty:item.quantity-1 })}>−</button>
                    <span className="qty-value">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => dispatch({ type:'UPDATE_QTY', index:idx, qty:item.quantity+1 })}>+</button>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                    <div className="cart-item-subtotal">{fmt(item.unit_price * item.quantity)}</div>
                    <button
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:12, padding:'2px 4px' }}
                      onClick={() => dispatch({ type:'REMOVE', index:idx })}
                    >✕</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-footer">
            <div className="cart-summary">
              <div className="cart-row">
                <span>Subtotal</span>
                <span className="amount" style={{ fontFamily:'var(--font-mono)' }}>{fmt(subtotal)}</span>
              </div>
              <div className="cart-row">
                <span>IVA</span>
                <span className="amount" style={{ fontFamily:'var(--font-mono)' }}>{fmt(tax)}</span>
              </div>
              <div className="cart-row total">
                <span>Total</span>
                <span className="amount">{fmt(total)}</span>
              </div>
            </div>
            <button
              className="btn btn-primary btn-lg"
              style={{ width:'100%' }}
              onClick={() => setShowPayment(true)}
              disabled={!cart.items.length}
            >
              💳 Cobrar {cart.items.length > 0 ? fmt(total) : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile cart toggle */}
      {window.innerWidth <= 768 && cart.items.length > 0 && !cartOpen && (
        <button
          className="btn btn-primary"
          style={{ position:'fixed', bottom:24, right:24, borderRadius:'var(--radius-full)', padding:'14px 20px', zIndex:150, boxShadow:'var(--shadow-lg)' }}
          onClick={() => setCartOpen(true)}
        >
          🛒 {cart.items.reduce((s,i)=>s+i.quantity,0)} — {fmt(total)}
        </button>
      )}

      {cartOpen && window.innerWidth <= 768 && (
        <div className="modal-overlay" style={{ zIndex:199 }} onClick={() => setCartOpen(false)} />
      )}

      {showPayment && (
        <PaymentModal
          total={total}
          onClose={() => setShowPayment(false)}
          onPay={handleCheckout}
        />
      )}
    </>
  );
}
