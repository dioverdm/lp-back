import React, { useState, useEffect } from 'react';
import { warehouses as wApi, categories as cApi, discounts as dApi, businesses as bizApi } from '../api';
import { useApp } from '../contexts/AppContext';
import { Modal, Confirm, fmt } from '../components/BusinessSwitcher';

const TABS = [
  { id: 'business',   label: 'Empresa',     icon: 'fa-building'   },
  { id: 'warehouses', label: 'Bodegas',      icon: 'fa-warehouse'  },
  { id: 'categories', label: 'Categorías',   icon: 'fa-tag'        },
  { id: 'discounts',  label: 'Descuentos',   icon: 'fa-percent'    },
  { id: 'plan',       label: 'Plan',         icon: 'fa-crown'      },
];

export default function Settings() {
  const { business, user, refreshBizList, toast } = useApp();
  const [tab, setTab]     = useState('business');
  const [wh, setWh]       = useState([]);
  const [cats, setCats]   = useState([]);
  const [discs, setDiscs] = useState([]);
  const [bizForm, setBizForm] = useState(null);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!business) return;
    setBizForm({
      name: business.name || '',
      description: business.description || '',
      address: business.address || '',
      phone: business.phone || '',
      email: business.email || '',
      taxId: business.tax_id || '',
      currency: business.currency || 'USD',
      taxRate: business.taxRate ?? business.tax_rate ?? 0,
      taxLabel: business.taxLabel || business.tax_label || 'IVA',
      catalogPublic: !!business.catalog_public,
    });
    wApi.list().then(setWh).catch(() => {});
    cApi.list().then(setCats).catch(() => {});
    dApi.list().then(setDiscs).catch(() => {});
  }, [business]);

  const saveBiz = async () => {
    setSaving(true);
    try {
      await bizApi.update(business.id, bizForm);
      await refreshBizList();
      toast('Empresa actualizada', 'success');
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  if (!business) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
      Selecciona o crea una empresa para ver la configuración
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Configuración</h1>
          <p>{business.name}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '2px solid var(--border)', marginBottom: 24, overflowX: 'auto' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: -2,
            fontWeight: 600, fontSize: '.88rem', color: tab === t.id ? 'var(--primary)' : 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <i className={`fa-solid ${t.icon}`}></i> {t.label}
          </button>
        ))}
      </div>

      {/* ── Business ── */}
      {tab === 'business' && bizForm && (
        <div className="card" style={{ maxWidth: 620 }}>
          <div className="card-title">Datos de la Empresa</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Nombre *</label><input className="form-control" value={bizForm.name} onChange={(e) => setBizForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">ID Fiscal / NIT</label><input className="form-control" value={bizForm.taxId} onChange={(e) => setBizForm((p) => ({ ...p, taxId: e.target.value }))} placeholder="J-12345678" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={bizForm.email} onChange={(e) => setBizForm((p) => ({ ...p, email: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Teléfono</label><input className="form-control" value={bizForm.phone} onChange={(e) => setBizForm((p) => ({ ...p, phone: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Dirección</label><input className="form-control" value={bizForm.address} onChange={(e) => setBizForm((p) => ({ ...p, address: e.target.value }))} /></div>
          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Moneda</label>
              <select className="form-control" value={bizForm.currency} onChange={(e) => setBizForm((p) => ({ ...p, currency: e.target.value }))}>
                <option value="USD">USD</option><option value="VES">VES</option>
                <option value="COP">COP</option><option value="MXN">MXN</option>
                <option value="PEN">PEN</option><option value="EUR">EUR</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">% Impuesto</label><input className="form-control" type="number" step="0.01" min="0" max="100" value={bizForm.taxRate} onChange={(e) => setBizForm((p) => ({ ...p, taxRate: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Etiqueta</label><input className="form-control" value={bizForm.taxLabel} onChange={(e) => setBizForm((p) => ({ ...p, taxLabel: e.target.value }))} placeholder="IVA" /></div>
          </div>
          <div className="form-group"><label className="form-label">Descripción</label><textarea className="form-control" value={bizForm.description} onChange={(e) => setBizForm((p) => ({ ...p, description: e.target.value }))} rows={2} /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer', padding: '12px 14px', background: bizForm.catalogPublic ? 'var(--success-bg)' : 'var(--bg)', borderRadius: 10, border: `1px solid ${bizForm.catalogPublic ? 'var(--success)' : 'var(--border)'}` }}>
            <input type="checkbox" checked={bizForm.catalogPublic} onChange={(e) => setBizForm((p) => ({ ...p, catalogPublic: e.target.checked }))} style={{ width: 16, height: 16 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '.88rem' }}>Catálogo público activo</div>
              <div style={{ fontSize: '.75rem', color: 'var(--text-secondary)' }}>Tu tienda estará disponible en /@{business.slug}</div>
            </div>
          </label>
          <button className="btn btn-primary" onClick={saveBiz} disabled={saving}>{saving ? 'Guardando...' : 'Guardar Cambios'}</button>
        </div>
      )}

      {/* ── Warehouses ── */}
      {tab === 'warehouses' && (
        <EntityManager title="Bodega" items={wh} onRefresh={() => wApi.list().then(setWh)}
          onCreate={(d) => wApi.create(d)} onDelete={(id) => wApi.remove(id)}
          fields={[{ key: 'name', label: 'Nombre', required: true }, { key: 'description', label: 'Descripción' }, { key: 'address', label: 'Dirección' }]}
          toast={toast} />
      )}

      {/* ── Categories ── */}
      {tab === 'categories' && (
        <EntityManager title="Categoría" items={cats} onRefresh={() => cApi.list().then(setCats)}
          onCreate={(d) => cApi.create(d)} onDelete={(id) => cApi.remove(id)}
          fields={[{ key: 'name', label: 'Nombre', required: true }, { key: 'color', label: 'Color', type: 'color', default: '#6B00FF' }]}
          renderRow={(item) => <><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: item.color, marginRight: 8 }}></span>{item.name}<span style={{ fontSize: '.72rem', color: 'var(--text-secondary)', marginLeft: 8 }}>({item.productCount || 0} productos)</span></>}
          toast={toast} />
      )}

      {/* ── Discounts ── */}
      {tab === 'discounts' && (
        <DiscountsManager discs={discs} onRefresh={() => dApi.list().then(setDiscs)} currency={business?.currency} toast={toast} />
      )}

      {/* ── Plan ── */}
      {tab === 'plan' && <PlanView currentPlan={user?.plan} />}
    </div>
  );
}

// ── Generic entity manager (warehouses, categories) ───────────
function EntityManager({ title, items, onRefresh, onCreate, onDelete, fields, renderRow, toast }) {
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({});
  const [delId, setDelId]   = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const req = fields.find((f) => f.required && !form[f.key]);
    if (req) { alert(`${req.label} es requerido`); return; }
    setSaving(true);
    try { await onCreate(form); await onRefresh(); setModal(false); setForm({}); toast(`${title} creada`, 'success'); }
    catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    try { await onDelete(delId); await onRefresh(); toast('Eliminado', 'success'); }
    catch (e) { alert(e.message); }
    setDelId(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm({}); setModal(true); }}>
          <i className="fa-solid fa-plus"></i> Nueva {title}
        </button>
      </div>
      {items.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>Sin {title.toLowerCase()}s configuradas</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>{title}</th><th>Acciones</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><strong>{renderRow ? renderRow(item) : item.name}</strong></td>
                  <td><button className="btn btn-sm btn-danger" onClick={() => setDelId(item.id)}><i className="fa-solid fa-trash"></i> Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={`Nueva ${title}`} size="modal-sm"
        footer={<><button className="btn btn-outline" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '...' : 'Guardar'}</button></>}>
        {fields.map((field) => (
          <div key={field.key} className="form-group">
            <label className="form-label">{field.label}{field.required && ' *'}</label>
            {field.type === 'color' ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="color" style={{ width: 48, height: 40, border: '1.5px solid var(--border)', borderRadius: 8, padding: 4, cursor: 'pointer' }} value={form[field.key] || field.default || '#6B00FF'} onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))} />
                <input className="form-control" style={{ flex: 1 }} value={form[field.key] || field.default || '#6B00FF'} onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))} />
              </div>
            ) : (
              <input className="form-control" value={form[field.key] || ''} onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))} />
            )}
          </div>
        ))}
      </Modal>
      <Confirm open={!!delId} onClose={() => setDelId(null)} onConfirm={remove} title={`Eliminar ${title}`} message={`¿Seguro que deseas eliminar? Los productos asociados perderán esta referencia.`} danger />
    </div>
  );
}

// ── Discounts manager ─────────────────────────────────────────
function DiscountsManager({ discs, onRefresh, currency, toast }) {
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ name: '', type: 'percentage', value: '', code: '', active: true });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name || !form.value) { alert('Nombre y valor son requeridos'); return; }
    setSaving(true);
    try { await dApi.create({ ...form, value: parseFloat(form.value), active: form.active ? 1 : 0 }); await onRefresh(); setModal(false); setForm({ name: '', type: 'percentage', value: '', code: '', active: true }); toast('Descuento creado', 'success'); }
    catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const toggle = async (d) => {
    try { await dApi.update(d.id, { ...d, active: d.active ? 0 : 1 }); await onRefresh(); toast('Estado actualizado', 'success'); }
    catch (e) { alert(e.message); }
  };

  const remove = async (id) => {
    if (!window.confirm('¿Eliminar este descuento?')) return;
    try { await dApi.remove(id); await onRefresh(); toast('Eliminado', 'success'); }
    catch (e) { alert(e.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><i className="fa-solid fa-plus"></i> Nuevo Descuento</button>
      </div>
      {discs.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>Sin descuentos configurados</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Tipo</th><th>Valor</th><th>Código</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {discs.map((d) => (
                <tr key={d.id}>
                  <td><strong>{d.name}</strong></td>
                  <td style={{ fontSize: '.82rem' }}>{d.type === 'percentage' ? 'Porcentaje' : 'Monto fijo'}</td>
                  <td><strong>{d.type === 'percentage' ? `${d.value}%` : fmt(d.value, currency)}</strong></td>
                  <td>{d.code ? <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4, fontSize: '.78rem' }}>{d.code}</code> : <span style={{ color: 'var(--text-secondary)' }}>—</span>}</td>
                  <td><span className={`badge ${d.active ? 'badge-success' : 'badge-gray'}`}>{d.active ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-sm btn-outline" onClick={() => toggle(d)}>{d.active ? 'Pausar' : 'Activar'}</button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(d.id)}><i className="fa-solid fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo Descuento" size="modal-sm"
        footer={<><button className="btn btn-outline" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '...' : 'Crear'}</button></>}>
        <div className="form-group"><label className="form-label">Nombre *</label><input className="form-control" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ej: Descuento de temporada" /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Tipo</label><select className="form-control" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}><option value="percentage">Porcentaje (%)</option><option value="fixed">Monto fijo ($)</option></select></div>
          <div className="form-group"><label className="form-label">Valor *</label><input className="form-control" type="number" step="0.01" min="0" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} placeholder={form.type === 'percentage' ? '10' : '5.00'} /></div>
        </div>
        <div className="form-group"><label className="form-label">Código promocional (opcional)</label><input className="form-control" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="PROMO10" /></div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} /> Activar inmediatamente</label>
      </Modal>
    </div>
  );
}

// ── Plan comparison ───────────────────────────────────────────
function PlanView({ currentPlan }) {
  const PLANS = [
    { id: 'free',       label: 'Gratuito',   price: '0',     features: ['1 empresa', '50 productos', '1 miembro', '30 facturas/mes', 'Sin catálogo público'] },
    { id: 'starter',    label: 'Starter',    price: '9.99',  features: ['2 empresas', '200 productos', '3 miembros', '150 facturas/mes', 'Catálogo público', 'Descuentos'] },
    { id: 'pro',        label: 'Pro',        price: '29.99', features: ['5 empresas', '2,000 productos', '10 miembros', '1,000 facturas/mes', 'Todo Starter', 'Analíticas avanzadas', 'Acceso API'] },
    { id: 'enterprise', label: 'Enterprise', price: '99.99', features: ['Empresas ilimitadas', 'Productos ilimitados', 'Miembros ilimitados', 'Facturas ilimitadas', 'Soporte prioritario 24/7'] },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
      {PLANS.map((plan) => {
        const isCurrent = currentPlan === plan.id;
        return (
          <div key={plan.id} className="card" style={{ border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
            {isCurrent && <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--primary)', color: 'white', fontSize: '.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: '0 0 0 10px' }}>ACTIVO</div>}
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '1.1rem', marginBottom: 6 }}>{plan.label}</div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.6rem', color: 'var(--primary)', marginBottom: 16 }}>
              ${plan.price}<span style={{ fontWeight: 400, fontSize: '.8rem', color: 'var(--text-secondary)' }}>/mes</span>
            </div>
            {plan.features.map((feat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: '.82rem' }}>
                <i className="fa-solid fa-check" style={{ color: 'var(--success)', fontSize: '.75rem', flexShrink: 0 }}></i>
                {feat}
              </div>
            ))}
            {!isCurrent && (
              <button className="btn btn-outline btn-block btn-sm" style={{ marginTop: 16 }}>
                {currentPlan === 'enterprise' ? 'Tu plan es mejor' : 'Actualizar plan'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
