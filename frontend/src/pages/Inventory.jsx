import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { products as pApi, categories as cApi, warehouses as wApi } from '../api';
import { useApp } from '../contexts/AppContext';
import { Modal, Confirm, Empty, Loading, StockBadge, fmt } from '../components/BusinessSwitcher';

export default function Inventory() {
  const { business, toast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [filterLow, setFilterLow] = useState(searchParams.get('filter') === 'lowStock');
  const [view, setView] = useState('grid'); // grid | table
  const [modal, setModal] = useState(null); // null | 'product' | 'stock' | 'scan'
  const [editing, setEditing] = useState(null);
  const [stockItem, setStockItem] = useState(null);
  const [delId, setDelId] = useState(null);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterCat) params.category = filterCat;
      if (filterWarehouse) params.warehouse = filterWarehouse;
      if (filterLow) params.lowStock = 'true';
      const [res, c, w] = await Promise.all([pApi.list(params), cApi.list(), wApi.list()]);
      setItems(res.products || []);
      setTotal(res.total || 0);
      setCats(c);
      setWarehouses(w);
    } catch { toast('Error al cargar productos', 'error'); }
    finally { setLoading(false); }
  }, [business, search, filterCat, filterWarehouse, filterLow]);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setEditing(null); setModal('product'); };
  const openEdit = (p)  => { setEditing(p);   setModal('product'); };
  const openStock = (p) => { setStockItem(p);  setModal('stock'); };

  const handleDelete = async () => {
    try { await pApi.remove(delId); toast('Producto eliminado', 'success'); load(); }
    catch { toast('Error al eliminar', 'error'); }
    setDelId(null);
  };

  const inventoryValue = items.reduce((s, p) => s + p.price * p.stock, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Inventario</h1>
          <p>{total} productos · Valor: {fmt(inventoryValue, business?.currency)}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline" onClick={() => setModal('scan')}><i className="fa-solid fa-barcode"></i> Escanear</button>
          <button className="btn btn-primary" onClick={openNew}><i className="fa-solid fa-plus"></i> Nuevo Producto</button>
        </div>
      </div>

      {/* Search & filters */}
      <div className="search-bar">
        <div className="search-input-wrap" style={{ maxWidth: 340 }}>
          <i className="fa-solid fa-search"></i>
          <input placeholder="Buscar por nombre, código..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">Todas las categorías</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="filter-select" value={filterWarehouse} onChange={e => setFilterWarehouse(e.target.value)}>
          <option value="">Todas las bodegas</option>
          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={filterLow} onChange={e => setFilterLow(e.target.checked)} />
          Solo bajos
        </label>
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          <button className={`icon-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}><i className="fa-solid fa-grip"></i></button>
          <button className={`icon-btn ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}><i className="fa-solid fa-list"></i></button>
        </div>
      </div>

      {loading ? <Loading /> : items.length === 0 ? (
        <Empty icon="fa-box-open" title="Sin productos" desc="Agrega tu primer producto al inventario" action={<button className="btn btn-primary" onClick={openNew}><i className="fa-solid fa-plus"></i> Agregar producto</button>} />
      ) : view === 'grid' ? (
        <div className="products-grid">
          {items.map(p => <ProductCard key={p.id} product={p} currency={business?.currency} onEdit={() => openEdit(p)} onStock={() => openStock(p)} onDetail={() => navigate(`/inventory/${p.id}`)} onDelete={() => setDelId(p.id)} />)}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg)', overflow: 'hidden', flexShrink: 0 }}>
                        {p.image_url ? <img src={p.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-image" style={{ color: 'var(--border)', fontSize: '.8rem', display: 'block', lineHeight: '36px', textAlign: 'center' }}></i>}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)' }}>{p.barcode || p.sku || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-purple" style={{ background: p.categoryColor + '20', color: p.categoryColor }}>{p.categoryName || '—'}</span></td>
                  <td><strong>{fmt(p.price, business?.currency)}</strong></td>
                  <td><strong>{p.stock}</strong> / mín {p.min_stock}</td>
                  <td><StockBadge stock={p.stock} minStock={p.min_stock} /></td>
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-sm btn-outline" onClick={() => navigate(`/inventory/${p.id}`)}><i className="fa-solid fa-eye"></i></button>
                      <button className="btn btn-sm btn-secondary" onClick={() => openStock(p)}><i className="fa-solid fa-arrows-rotate"></i></button>
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(p)}><i className="fa-solid fa-pen"></i></button>
                      <button className="btn btn-sm btn-danger" onClick={() => setDelId(p.id)}><i className="fa-solid fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {modal === 'product' && <ProductModal product={editing} cats={cats} warehouses={warehouses} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); toast(editing ? 'Producto actualizado' : 'Producto creado', 'success'); }} />}
      {modal === 'stock' && stockItem && <StockModal product={stockItem} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); toast('Stock actualizado', 'success'); }} />}
      {modal === 'scan' && <ScanModal onFound={(p) => { setModal(null); navigate(`/inventory/${p.id}`); }} onNotFound={(code) => { setModal(null); setEditing({ barcode: code }); setModal('product'); }} onClose={() => setModal(null)} />}
      <Confirm open={!!delId} onClose={() => setDelId(null)} onConfirm={handleDelete} title="Eliminar producto" message="¿Seguro que deseas eliminar este producto? Esta acción no se puede deshacer." danger />
    </div>
  );
}

function ProductCard({ product: p, currency, onEdit, onStock, onDetail, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="product-card">
      <div className="product-card-img" onClick={onDetail} style={{ cursor: 'pointer' }}>
        {p.image_url ? <img src={p.image_url} alt={p.name} /> : <i className="fa-solid fa-image no-img"></i>}
        <div className="product-card-badge"><StockBadge stock={p.stock} minStock={p.min_stock} /></div>
      </div>
      <div className="product-card-body">
        <div className="product-card-name" title={p.name}>{p.name}</div>
        <div className="product-card-cat">{p.categoryName || 'Sin categoría'}</div>
        <div className="product-card-meta">
          <span className="product-card-price">{fmt(p.price, currency)}</span>
          <span className="product-card-stock">{p.stock} uds</span>
        </div>
      </div>
      <div className="product-card-footer">
        <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={onStock}><i className="fa-solid fa-arrows-rotate"></i> Stock</button>
        <button className="btn btn-outline btn-sm btn-icon" onClick={onEdit}><i className="fa-solid fa-pen"></i></button>
        <div style={{ position: 'relative' }}>
          <button className="btn btn-outline btn-sm btn-icon" onClick={() => setMenuOpen(!menuOpen)}><i className="fa-solid fa-ellipsis"></i></button>
          {menuOpen && (
            <div className="dropdown-menu" style={{ right: 0, minWidth: 140 }}>
              <button className="dropdown-item" onClick={() => { onDetail(); setMenuOpen(false); }}><i className="fa-solid fa-eye"></i> Ver detalle</button>
              <hr className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={() => { onDelete(); setMenuOpen(false); }}><i className="fa-solid fa-trash"></i> Eliminar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductModal({ product, cats, warehouses, onClose, onSaved }) {
  const { business } = useApp();
  const [form, setForm] = useState({
    name: '', barcode: '', sku: '', categoryId: '', warehouseId: '',
    description: '', imageUrl: '', price: '', cost: '', unit: 'unidad',
    stock: '0', minStock: '5', featured: false, catalogVisible: true,
    ...product, price: product?.price ?? '', cost: product?.cost ?? '', stock: product?.stock ?? '0', minStock: product?.min_stock ?? '5',
    categoryId: product?.category_id ?? '', warehouseId: product?.warehouse_id ?? '',
    imageUrl: product?.image_url ?? '', barcode: product?.barcode ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!product?.id;

  const save = async () => {
    if (!form.name) { setError('El nombre es requerido'); return; }
    setSaving(true); setError('');
    try {
      const body = { ...form, price: parseFloat(form.price) || 0, cost: parseFloat(form.cost) || 0, stock: parseInt(form.stock) || 0, minStock: parseInt(form.minStock) || 5, categoryId: form.categoryId || null, warehouseId: form.warehouseId || null, imageUrl: form.imageUrl || null, barcode: form.barcode || null, sku: form.sku || null };
      if (isEdit) await pApi.update(product.id, body);
      else await pApi.create(body);
      onSaved();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <Modal open title={isEdit ? 'Editar Producto' : 'Nuevo Producto'} onClose={onClose} size="modal-lg"
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Producto'}</button></>}>
      {error && <div className="badge badge-danger" style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, width: '100%' }}>{error}</div>}
      <div className="form-row">
        <div className="form-group"><label className="form-label">Nombre *</label><input className="form-control" value={form.name} onChange={f('name')} placeholder="Ej: Camisa Azul Talla M" /></div>
        <div className="form-group"><label className="form-label">Código de Barras</label><input className="form-control" value={form.barcode} onChange={f('barcode')} placeholder="EAN / UPC / QR" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">SKU</label><input className="form-control" value={form.sku} onChange={f('sku')} placeholder="Referencia interna" /></div>
        <div className="form-group"><label className="form-label">Unidad</label><select className="form-control" value={form.unit} onChange={f('unit')}><option>unidad</option><option>kg</option><option>litro</option><option>metro</option><option>caja</option><option>par</option></select></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Categoría</label><select className="form-control" value={form.categoryId} onChange={f('categoryId')}><option value="">Sin categoría</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Bodega</label><select className="form-control" value={form.warehouseId} onChange={f('warehouseId')}><option value="">Sin bodega</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
      </div>
      <div className="form-row-3">
        <div className="form-group"><label className="form-label">Precio Venta</label><div className="input-group"><span className="input-group-icon">$</span><input className="form-control" type="number" step="0.01" value={form.price} onChange={f('price')} placeholder="0.00" /></div></div>
        <div className="form-group"><label className="form-label">Costo</label><div className="input-group"><span className="input-group-icon">$</span><input className="form-control" type="number" step="0.01" value={form.cost} onChange={f('cost')} placeholder="0.00" /></div></div>
        <div className="form-group"><label className="form-label">Stock Mínimo</label><input className="form-control" type="number" value={form.minStock} onChange={f('minStock')} /></div>
      </div>
      {!isEdit && <div className="form-group"><label className="form-label">Stock Inicial</label><input className="form-control" type="number" value={form.stock} onChange={f('stock')} /></div>}
      <div className="form-group"><label className="form-label">Imagen (URL)</label><input className="form-control" value={form.imageUrl} onChange={f('imageUrl')} placeholder="https://..." /></div>
      <div className="form-group"><label className="form-label">Descripción</label><textarea className="form-control" value={form.description} onChange={f('description')} rows={2} /></div>
      <div style={{ display: 'flex', gap: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '.85rem' }}><input type="checkbox" checked={form.featured} onChange={f('featured')} /> Destacado en catálogo</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '.85rem' }}><input type="checkbox" checked={form.catalogVisible} onChange={f('catalogVisible')} /> Visible en catálogo</label>
      </div>
    </Modal>
  );
}

function StockModal({ product, onClose, onSaved }) {
  const [type, setType] = useState('INBOUND');
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!qty || parseInt(qty) <= 0) { setError('Ingresa una cantidad válida'); return; }
    setSaving(true);
    try { await pApi.stock(product.id, { type, quantity: parseInt(qty), notes }); onSaved(); }
    catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <Modal open title={`Ajustar Stock — ${product.name}`} onClose={onClose} size="modal-sm"
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '...' : 'Guardar'}</button></>}>
      <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 12, marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '.82rem', color: 'var(--text-secondary)' }}>Stock actual</span>
        <strong style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem' }}>{product.stock}</strong>
      </div>
      {error && <p style={{ color: 'var(--danger)', marginBottom: 10, fontSize: '.85rem' }}>{error}</p>}
      <div className="form-group">
        <label className="form-label">Tipo de movimiento</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['INBOUND', 'Entrada', 'var(--success)'], ['OUTBOUND', 'Salida', 'var(--danger)'], ['ADJUSTMENT', 'Ajuste', 'var(--warning)']].map(([v, l, c]) => (
            <button key={v} onClick={() => setType(v)} style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: type === v ? `2px solid ${c}` : '2px solid var(--border)', background: type === v ? c + '15' : 'none', fontWeight: 600, fontSize: '.78rem', color: type === v ? c : 'var(--text-secondary)', cursor: 'pointer' }}>{l}</button>
          ))}
        </div>
      </div>
      <div className="form-group"><label className="form-label">{type === 'ADJUSTMENT' ? 'Nuevo Stock' : 'Cantidad'}</label><input className="form-control" type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" /></div>
      <div className="form-group"><label className="form-label">Notas (opcional)</label><input className="form-control" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Motivo del ajuste..." /></div>
    </Modal>
  );
}

function ScanModal({ onFound, onNotFound, onClose }) {
  const { business } = useApp();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef();
  useEffect(() => { inputRef.current?.focus(); }, []);

  const lookup = async (val = code) => {
    if (!val.trim()) return;
    try { const p = await pApi.barcode(val.trim()); onFound(p); }
    catch { setError(`Código "${val}" no encontrado`); }
  };

  return (
    <Modal open title="Buscar por Código" onClose={onClose} size="modal-sm"
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancelar</button>{error && <button className="btn btn-primary" onClick={() => { onNotFound(code); }}>Crear producto</button>}</>}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '.85rem', marginBottom: 14 }}>Escanea o escribe el código de barras del producto</p>
      <div className="form-group">
        <div className="input-group">
          <i className="fa-solid fa-barcode input-group-icon"></i>
          <input ref={inputRef} className="form-control" value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()} placeholder="Escanea aquí..." style={{ paddingLeft: 38 }} />
        </div>
      </div>
      {error && <p style={{ color: 'var(--danger)', fontSize: '.82rem' }}>{error}</p>}
      <button className="btn btn-primary btn-block" onClick={() => lookup()}><i className="fa-solid fa-search"></i> Buscar</button>
    </Modal>
  );
}
