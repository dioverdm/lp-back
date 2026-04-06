import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useToast } from '../../context/AppContext.jsx';

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

function ProductModal({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState(product || {
    name:'', sku:'', barcode:'', price:'', cost:'', category_id:'',
    tax_rate:'16', unit:'unit', is_public:true, is_active:true,
    description:'', image_url:'', initial_stock:'0', min_stock:'5',
  });
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await onSave(form); onClose(); }
    catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal animate-scale-in" style={{ maxWidth:600, maxHeight:'90vh', overflow:'auto' }}>
        <div className="modal-header">
          <span className="modal-title">{product ? 'Editar producto' : 'Nuevo producto'}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Nombre *</label>
                <input className="form-input" value={form.name} onChange={e=>set('name',e.target.value)} required placeholder="Nombre del producto" />
              </div>
              <div className="form-group">
                <label className="form-label">SKU</label>
                <input className="form-input" value={form.sku||''} onChange={e=>set('sku',e.target.value)} placeholder="PROD-001" />
              </div>
              <div className="form-group">
                <label className="form-label">Código de barras</label>
                <input className="form-input" value={form.barcode||''} onChange={e=>set('barcode',e.target.value)} placeholder="7891234567890" />
              </div>
              <div className="form-group">
                <label className="form-label">Precio venta *</label>
                <input className="form-input" type="number" step="0.01" min="0" value={form.price} onChange={e=>set('price',e.target.value)} required placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Costo</label>
                <input className="form-input" type="number" step="0.01" min="0" value={form.cost||''} onChange={e=>set('cost',e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-select" value={form.category_id||''} onChange={e=>set('category_id',e.target.value)}>
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">IVA %</label>
                <input className="form-input" type="number" min="0" max="100" value={form.tax_rate||16} onChange={e=>set('tax_rate',e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Unidad</label>
                <select className="form-select" value={form.unit||'unit'} onChange={e=>set('unit',e.target.value)}>
                  <option value="unit">Unidad</option>
                  <option value="kg">Kilogramo</option>
                  <option value="ltr">Litro</option>
                  <option value="box">Caja</option>
                  <option value="m">Metro</option>
                </select>
              </div>
              {!product && (
                <>
                  <div className="form-group">
                    <label className="form-label">Stock inicial</label>
                    <input className="form-input" type="number" min="0" value={form.initial_stock||0} onChange={e=>set('initial_stock',e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock mínimo</label>
                    <input className="form-input" type="number" min="0" value={form.min_stock||5} onChange={e=>set('min_stock',e.target.value)} />
                  </div>
                </>
              )}
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">URL de imagen</label>
                <input className="form-input" value={form.image_url||''} onChange={e=>set('image_url',e.target.value)} placeholder="https://..." />
              </div>
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Descripción</label>
                <textarea className="form-textarea" value={form.description||''} onChange={e=>set('description',e.target.value)} placeholder="Descripción del producto..." />
              </div>
              <div style={{ display:'flex', gap:16, alignItems:'center', gridColumn:'1/-1' }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14 }}>
                  <input type="checkbox" checked={!!form.is_active} onChange={e=>set('is_active',e.target.checked)} />
                  Activo
                </label>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14 }}>
                  <input type="checkbox" checked={!!form.is_public} onChange={e=>set('is_public',e.target.checked)} />
                  Visible en vitrina pública
                </label>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner spinner-sm" /> : '💾 Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Catalog() {
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal, setModal]         = useState(null); // null | 'create' | product
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const { toast }                 = useToast();
  const LIMIT = 20;

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit:LIMIT });
      if (search)    params.set('search', search);
      if (catFilter) params.set('category_id', catFilter);
      const data = await api.get(`/catalog/products?${params}`);
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [page, search, catFilter]);

  useEffect(() => {
    api.get('/catalog/categories').then(setCategories).catch(console.error);
  }, []);

  const handleSave = async (form) => {
    if (modal === 'create') {
      await api.post('/catalog/products', form);
      toast('Producto creado', 'success');
    } else {
      await api.put(`/catalog/products/${modal.id}`, form);
      toast('Producto actualizado', 'success');
    }
    fetchProducts();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar este producto?')) return;
    await api.delete(`/catalog/products/${id}`);
    toast('Producto desactivado', 'success');
    fetchProducts();
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Catálogo de Productos</h1>
          <p>{total} productos registrados</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setModal('create')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom:16, padding:14 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <div className="search-input-wrap" style={{ flex:1, minWidth:200, position:'relative' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className="form-input" placeholder="Buscar..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft:38 }} />
          </div>
          <select className="form-select" style={{ width:180 }} value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding:0 }}>
        <div className="table-wrapper" style={{ border:'none', borderRadius:'var(--radius-lg)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Costo</th>
                <th>Stock</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding:48, textAlign:'center' }}><div className="spinner spinner-md" style={{ margin:'0 auto' }} /></td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <div className="empty-title">Sin productos</div>
                    <div className="empty-desc">Crea tu primer producto para empezar</div>
                    <button className="btn btn-primary btn-sm" onClick={() => setModal('create')}>Crear producto</button>
                  </div>
                </td></tr>
              ) : products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:8, background:'var(--bg-surface-3)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                        {p.image_url ? <img src={p.image_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span>📦</span>}
                      </div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:13 }}>{p.name}</div>
                        {p.barcode && <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{p.barcode}</div>}
                      </div>
                    </div>
                  </td>
                  <td><span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-muted)' }}>{p.sku || '—'}</span></td>
                  <td><span style={{ fontSize:12 }}>{p.category_name || '—'}</span></td>
                  <td><span style={{ fontWeight:700, fontFamily:'var(--font-mono)', color:'var(--brand-primary)' }}>{fmt(p.price)}</span></td>
                  <td><span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-muted)' }}>{fmt(p.cost)}</span></td>
                  <td>
                    <div className={`stock-indicator ${Number(p.stock)<=0?'stock-zero':Number(p.stock)<=5?'stock-low':'stock-ok'}`}>
                      <div className="stock-dot" />
                      {Number(p.stock)}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${p.is_active ? 'badge-success' : 'badge-neutral'}`}>
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(p)} title="Editar">✏️</button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(p.id)} title="Desactivar">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, padding:16, borderTop:'1px solid var(--border-color)' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}>← Anterior</button>
            <span style={{ fontSize:13, color:'var(--text-muted)' }}>Pág {page} de {pages}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p=>Math.min(pages,p+1))} disabled={page===pages}>Siguiente →</button>
          </div>
        )}
      </div>

      {modal !== null && (
        <ProductModal
          product={modal === 'create' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
