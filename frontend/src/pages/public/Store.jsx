import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api.js';

const fmt = (n, cur='USD') =>
  new Intl.NumberFormat('es-VE',{style:'currency',currency:cur,minimumFractionDigits:2}).format(n||0);

const EMOJI = { bebidas:'☕', comidas:'🍔', postres:'🍰', snacks:'🥨', default:'📦' };
const prodEmoji = (cat='') => {
  const k = cat.toLowerCase();
  return Object.entries(EMOJI).find(([key]) => k.includes(key))?.[1] || EMOJI.default;
};

function CartDrawer({ cart, company, onRemove, onChangeQty, onClose }) {
  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);

  const handleWhatsApp = () => {
    if (!company.whatsapp) return alert('Esta empresa no tiene WhatsApp configurado');
    const lines = cart.map(i=>`• ${i.qty}x ${i.name} — ${fmt(i.price*i.qty,company.currency)}`).join('\n');
    const msg = `¡Hola! Me interesa hacer un pedido:\n\n${lines}\n\n*Total: ${fmt(subtotal,company.currency)}*`;
    window.open(`https://wa.me/${company.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex' }}>
      <div style={{ flex:1, background:'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div style={{ width:360, background:'var(--bg-surface)', display:'flex', flexDirection:'column', boxShadow:'var(--shadow-lg)', animation:'slideIn 0.3s ease' }}>
        <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid var(--border-color)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontWeight:700, fontSize:16 }}>🛒 Tu carrito</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
          {cart.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🛒</div><div className="empty-title">Carrito vacío</div></div>
          ) : cart.map((item,i) => (
            <div key={i} style={{ display:'flex', gap:12, padding:12, background:'var(--bg-surface-2)', borderRadius:'var(--radius-md)', border:'1px solid var(--border-color)' }}>
              <div style={{ width:48, height:48, borderRadius:10, background:'var(--bg-surface-3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0, overflow:'hidden' }}>
                {item.image_url ? <img src={item.image_url} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:10 }}/> : prodEmoji(item.category)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                <div style={{ fontSize:12, color:'var(--brand-primary)', fontWeight:700, fontFamily:'var(--font-mono)' }}>{fmt(item.price, company.currency)} c/u</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
                  <button className="qty-btn" onClick={()=>onChangeQty(i,item.qty-1)}>−</button>
                  <span className="qty-value" style={{ minWidth:24 }}>{item.qty}</span>
                  <button className="qty-btn" onClick={()=>onChangeQty(i,item.qty+1)}>+</button>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                <span style={{ fontWeight:800, fontSize:14, fontFamily:'var(--font-mono)' }}>{fmt(item.price*item.qty, company.currency)}</span>
                <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:12 }} onClick={()=>onRemove(i)}>✕</button>
              </div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div style={{ padding:20, borderTop:'1px solid var(--border-color)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:18, fontWeight:800, marginBottom:16 }}>
              <span>Total</span>
              <span style={{ color:'var(--brand-primary)', fontFamily:'var(--font-mono)' }}>{fmt(subtotal, company.currency)}</span>
            </div>
            <button className="btn btn-primary btn-lg" style={{ width:'100%', background:'#25D366', boxShadow:'0 4px 20px rgba(37,211,102,0.3)' }} onClick={handleWhatsApp}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Pedir por WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Store() {
  const { slug }            = useParams();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [catFilter, setCat] = useState('all');
  const [cart, setCart]     = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get(`/public/${slug}`)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const addToCart = (product, direct = false) => {
    setCart(c => {
      const idx = c.findIndex(i => i.id === product.id);
      if (idx >= 0) {
        const next = [...c];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...c, { ...product, qty: 1 }];
    });
    if (direct) {
      // WhatsApp directo para 1 producto
      const { company } = data;
      if (!company.whatsapp) return;
      const msg = `¡Hola! Me interesa este producto:\n\n• ${product.name} — ${fmt(product.price, company.currency)}\n\n¿Está disponible?`;
      window.open(`https://wa.me/${company.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      setCartOpen(true);
    }
  };

  const removeFromCart  = (i) => setCart(c => c.filter((_,idx) => idx !== i));
  const changeQty       = (i, qty) => {
    if (qty <= 0) return removeFromCart(i);
    setCart(c => c.map((it,idx) => idx===i ? {...it,qty} : it));
  };

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}><div className="spinner spinner-lg"/></div>;
  if (error || !data) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}><div style={{ fontSize:48 }}>😕</div><h2>Tienda no encontrada</h2><p style={{ color:'var(--text-muted)' }}>La tienda @{slug} no existe o no está disponible</p></div>;

  const { company, categories, products } = data;
  const cartCount = cart.reduce((s,i)=>s+i.qty,0);

  const filtered = products.filter(p => {
    if (catFilter !== 'all' && String(p.category_id) !== catFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)', fontFamily:'var(--font-main)' }}>
      {/* Header */}
      <header style={{ background:'var(--brand-dark)', color:'#fff', padding:'20px 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', gap:16 }}>
          {company.logo_url
            ? <img src={company.logo_url} style={{ width:48, height:48, borderRadius:12, objectFit:'cover' }} />
            : <div style={{ width:48, height:48, borderRadius:12, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800 }}>{company.name?.charAt(0)}</div>
          }
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:800 }}>{company.name}</div>
            {company.address && <div style={{ fontSize:12, opacity:0.75, marginTop:2 }}>📍 {company.address}</div>}
          </div>
          <button
            className="btn"
            style={{ background:'rgba(255,255,255,0.15)', color:'#fff', backdropFilter:'blur(10px)', position:'relative' }}
            onClick={() => setCartOpen(true)}
          >
            🛒 Carrito
            {cartCount > 0 && (
              <span style={{ position:'absolute', top:-6, right:-6, background:'#E74C3C', color:'#fff', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800 }}>{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 16px' }}>
        {/* Search */}
        <div style={{ marginBottom:20 }}>
          <input className="form-input" style={{ fontSize:15, padding:'12px 16px', borderRadius:'var(--radius-xl)' }}
            placeholder={`🔍 Buscar en ${company.name}...`}
            value={search} onChange={e=>setSearch(e.target.value)} />
        </div>

        {/* Category tabs */}
        <div className="category-tabs" style={{ marginBottom:20 }}>
          <div className={`category-tab ${catFilter==='all'?'active':''}`} onClick={()=>setCat('all')}>
            Todos
          </div>
          {categories.map(c => (
            <div key={c.id} className={`category-tab ${catFilter===String(c.id)?'active':''}`} onClick={()=>setCat(String(c.id))}>
              {c.name}
            </div>
          ))}
        </div>

        {/* Products */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:16 }}>
          {filtered.map(p => (
            <div key={p.id} className="card" style={{ padding:0, overflow:'hidden', cursor:'default' }}>
              <div style={{ aspectRatio:'4/3', background:'var(--bg-surface-3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:52, overflow:'hidden' }}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : prodEmoji(categories.find(c=>c.id===p.category_id)?.name)
                }
              </div>
              <div style={{ padding:14 }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{p.name}</div>
                {p.description && <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:10, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{p.description}</div>}
                <div style={{ fontSize:20, fontWeight:800, color:'var(--brand-primary)', fontFamily:'var(--font-mono)', marginBottom:12 }}>
                  {fmt(p.price, company.currency)}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex:1 }} onClick={() => addToCart(p)}>
                    + Carrito
                  </button>
                  {company.whatsapp && (
                    <button
                      className="btn btn-sm"
                      style={{ background:'#25D366', color:'#fff', borderRadius:'var(--radius-md)', padding:'6px 10px' }}
                      onClick={() => addToCart(p, true)}
                      title="Comprar por WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state" style={{ gridColumn:'1/-1' }}>
              <div className="empty-icon">🔍</div>
              <div className="empty-title">Sin resultados</div>
            </div>
          )}
        </div>
      </div>

      {cartOpen && (
        <CartDrawer
          cart={cart}
          company={company}
          onRemove={removeFromCart}
          onChangeQty={changeQty}
          onClose={() => setCartOpen(false)}
        />
      )}
    </div>
  );
}
