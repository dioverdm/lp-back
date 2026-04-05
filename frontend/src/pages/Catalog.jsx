import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { catalog as catApi } from '../api';

export default function PublicCatalog() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    catApi.get(slug, { search, category }).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [slug, search, category]);

  const addToCart = (p) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      return ex ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...p, qty: 1 }];
    });
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const currency = data?.business?.currency || 'USD';

  const fmt = (v) => new Intl.NumberFormat('es-VE', { style: 'currency', currency, minimumFractionDigits: 2 }).format(v || 0);
  const finalPrice = (p) => {
    if (!p.discountActive || !p.discountValue) return p.price;
    return p.discountType === 'percentage' ? p.price * (1 - p.discountValue / 100) : Math.max(0, p.price - p.discountValue);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner"></div></div>;
  if (!data) return <div style={{ textAlign: 'center', padding: 60 }}><h2>Tienda no encontrada</h2><p style={{ color: 'var(--text-secondary)' }}>El catálogo /@{slug} no existe o no está activo</p></div>;

  const { business, products, categories } = data;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', color: 'white', padding: '40px 24px', textAlign: 'center' }}>
        {business.logo && <img src={business.logo} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '3px solid white', marginBottom: 12 }} />}
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '1.8rem', marginBottom: 6 }}>{business.name}</h1>
        {business.description && <p style={{ opacity: .85, maxWidth: 400, margin: '0 auto' }}>{business.description}</p>}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 14, fontSize: '.82rem', opacity: .8 }}>
          {business.phone && <span><i className="fa-solid fa-phone"></i> {business.phone}</span>}
          {business.email && <span><i className="fa-solid fa-envelope"></i> {business.email}</span>}
          {business.address && <span><i className="fa-solid fa-location-dot"></i> {business.address}</span>}
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--surface)', padding: '16px 24px', display: 'flex', gap: 10, flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <i className="fa-solid fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}></i>
          <input style={{ paddingLeft: 36, height: 38, width: '100%', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '.88rem', outline: 'none' }} placeholder="Buscar productos..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {cart.length > 0 && (
          <button onClick={() => setCartOpen(!cartOpen)} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', padding: '0 16px', height: 38, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fa-solid fa-cart-shopping"></i> {totalItems}
          </button>
        )}
      </div>

      {/* Products */}
      <div style={{ padding: '20px 24px' }}>
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <i className="fa-solid fa-box-open" style={{ fontSize: '3rem', opacity: .2, display: 'block', marginBottom: 12 }}></i>
            <p>No hay productos disponibles</p>
          </div>
        ) : (
          <div className="products-grid" style={{ maxWidth: 1200, margin: '0 auto' }}>
            {products.map(p => {
              const price = finalPrice(p);
              const hasDisc = p.discountActive && p.discountValue;
              return (
                <div key={p.id} className="product-card">
                  <div className="product-card-img" style={{ height: 180 }}>
                    {p.image_url ? <img src={p.image_url} alt={p.name} /> : <i className="fa-solid fa-image no-img"></i>}
                    {hasDisc && (
                      <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--danger)', color: 'white', borderRadius: 6, padding: '3px 8px', fontSize: '.72rem', fontWeight: 700 }}>
                        {p.discountType === 'percentage' ? `-${p.discountValue}%` : `-${fmt(p.discountValue)}`}
                      </div>
                    )}
                    {p.featured && <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--warning)', color: 'white', borderRadius: 6, padding: '3px 8px', fontSize: '.72rem', fontWeight: 700 }}>⭐ Destacado</div>}
                  </div>
                  <div className="product-card-body">
                    {p.categoryName && <div className="product-card-cat" style={{ color: p.categoryColor }}>{p.categoryName}</div>}
                    <div className="product-card-name">{p.name}</div>
                    {p.description && <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)', marginTop: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.description}</div>}
                    <div className="product-card-meta" style={{ marginTop: 8 }}>
                      <div>
                        <span className="product-card-price">{fmt(price)}</span>
                        {hasDisc && <span style={{ fontSize: '.75rem', color: 'var(--text-secondary)', textDecoration: 'line-through', marginLeft: 6 }}>{fmt(p.price)}</span>}
                      </div>
                      <span className="product-card-stock" style={{ fontSize: '.72rem' }}>{p.stock} disp.</span>
                    </div>
                  </div>
                  <div className="product-card-footer">
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => addToCart(p)}>
                      <i className="fa-solid fa-cart-plus"></i> Agregar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mini cart panel */}
      {cartOpen && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--surface)', borderTop: '1px solid var(--border)', borderRadius: '20px 20px 0 0', padding: '20px', zIndex: 200, maxHeight: '50vh', overflowY: 'auto', boxShadow: '0 -4px 20px rgba(0,0,0,.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <strong>Tu pedido</strong>
            <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><i className="fa-solid fa-xmark"></i></button>
          </div>
          {cart.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: '.85rem' }}>
              <span>{item.qty}x {item.name}</span>
              <span style={{ fontWeight: 700 }}>{fmt(finalPrice(item) * item.qty)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem' }}>
            <span>Total</span>
            <span>{fmt(cart.reduce((s, i) => s + finalPrice(i) * i.qty, 0))}</span>
          </div>
          <p style={{ fontSize: '.75rem', color: 'var(--text-secondary)', marginTop: 8, textAlign: 'center' }}>
            Contacta al vendedor para completar tu pedido
          </p>
        </div>
      )}
    </div>
  );
}
