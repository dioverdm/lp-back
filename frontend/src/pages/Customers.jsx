import React, { useState, useEffect } from 'react';
import { customers as custApi } from '../api';
import { useApp } from '../contexts/AppContext';
import { Modal, Confirm, Empty, Loading } from '../components/BusinessSwitcher';

export default function Customers() {
  const { business, toast } = useApp();
  const [items, setItems]   = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [delId, setDelId]   = useState(null);

  const load = () => {
    if (!business) return;
    setLoading(true);
    custApi.list(search ? { search } : {}).then(setItems).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [business, search]);

  const handleDelete = async () => {
    try { await custApi.remove(delId); toast('Cliente eliminado', 'success'); load(); }
    catch { toast('Error al eliminar', 'error'); }
    setDelId(null);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Clientes</h1>
          <p>{items.length} registrados</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => { setEditing(null); setModal(true); }}>
            <i className="fa-solid fa-plus"></i> Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap">
          <i className="fa-solid fa-search"></i>
          <input placeholder="Buscar por nombre, email o teléfono..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <Loading /> : items.length === 0 ? (
        <Empty icon="fa-users" title="Sin clientes" desc="Agrega tus clientes para facturar más rápido"
          action={<button className="btn btn-primary" onClick={() => setModal(true)}><i className="fa-solid fa-plus"></i> Agregar cliente</button>} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>ID Fiscal</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.8rem', color: 'var(--primary)', flexShrink: 0 }}>
                        {c.name[0].toUpperCase()}
                      </div>
                      <strong>{c.name}</strong>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '.82rem' }}>{c.email || '—'}</td>
                  <td style={{ fontSize: '.82rem' }}>{c.phone || '—'}</td>
                  <td style={{ fontSize: '.82rem' }}>{c.tax_id || '—'}</td>
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-sm btn-outline" onClick={() => { setEditing(c); setModal(true); }}>
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => setDelId(c.id)}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <CustomerModal
          customer={editing}
          onClose={() => { setModal(false); setEditing(null); }}
          onSaved={() => { setModal(false); setEditing(null); load(); toast(editing ? 'Cliente actualizado' : 'Cliente creado', 'success'); }}
        />
      )}
      <Confirm open={!!delId} onClose={() => setDelId(null)} onConfirm={handleDelete}
        title="Eliminar cliente" message="¿Seguro que deseas eliminar este cliente?" danger />
    </div>
  );
}

function CustomerModal({ customer, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', taxId: '', notes: '',
    ...(customer || {}),
    taxId: customer?.tax_id || '',
  });
  const [saving, setSaving] = useState(false);
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    if (!form.name) { alert('El nombre es requerido'); return; }
    setSaving(true);
    try {
      customer?.id ? await custApi.update(customer.id, form) : await custApi.create(form);
      onSaved();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal open title={customer?.id ? 'Editar Cliente' : 'Nuevo Cliente'} onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button></>}>
      <div className="form-group"><label className="form-label">Nombre *</label><input className="form-control" value={form.name} onChange={f('name')} placeholder="Ej: María López" /></div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={form.email} onChange={f('email')} placeholder="cliente@email.com" /></div>
        <div className="form-group"><label className="form-label">Teléfono</label><input className="form-control" value={form.phone} onChange={f('phone')} placeholder="+58 424..." /></div>
      </div>
      <div className="form-group"><label className="form-label">ID Fiscal / RUT / NIT / Cédula</label><input className="form-control" value={form.taxId} onChange={f('taxId')} placeholder="V-12345678" /></div>
      <div className="form-group"><label className="form-label">Dirección</label><textarea className="form-control" value={form.address} onChange={f('address')} rows={2} placeholder="Calle, ciudad, estado..." /></div>
      <div className="form-group"><label className="form-label">Notas internas</label><textarea className="form-control" value={form.notes} onChange={f('notes')} rows={2} placeholder="Notas sobre el cliente..." /></div>
    </Modal>
  );
}
