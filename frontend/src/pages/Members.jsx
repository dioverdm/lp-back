import React, { useState, useEffect } from 'react';
import { businesses as bizApi } from '../api';
import { useApp } from '../contexts/AppContext';
import { Modal, Loading, RoleBadge } from '../components/BusinessSwitcher';

export default function Members() {
  const { business, toast } = useApp();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => {
    if (!business) return;
    setLoading(true);
    bizApi.members(business.id).then(setMembers).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [business]);

  const removeMember = async (memberId) => {
    if (!window.confirm('¿Seguro que deseas remover este miembro?')) return;
    try { await bizApi.removeMember(business.id, memberId); toast('Miembro removido', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const ROLE_DESCRIPTIONS = {
    owner:     'Acceso total. No se puede modificar.',
    admin:     'Gestión completa: productos, inventario, facturas, clientes, reportes, descuentos, bodegas.',
    moderator: 'Gestión de productos, inventario, categorías y descuentos. Sin acceso a facturas.',
    atc:       'Atención al cliente: puede facturar y gestionar clientes. Sin acceso a inventario.',
    viewer:    'Solo lectura: puede ver productos y reportes pero no modificar nada.',
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Equipo</h1>
          <p>Miembros de {business?.name}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => { setEditing(null); setModal(true); }}>
            <i className="fa-solid fa-user-plus"></i> Invitar Miembro
          </button>
        </div>
      </div>

      {/* Role guide */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>Guía de Roles</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => (
            <div key={role} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <RoleBadge role={role} />
              <p style={{ fontSize: '.72rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {loading ? <Loading /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Miembro</th><th>Email</th><th>Rol</th><th>Estado</th><th>Desde</th><th>Acciones</th></tr></thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '.85rem', flexShrink: 0 }}>
                        {m.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '.82rem' }}>{m.email}</td>
                  <td><RoleBadge role={m.role} /></td>
                  <td><span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{m.status === 'active' ? 'Activo' : 'Pendiente'}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '.78rem' }}>{new Date(m.created_at).toLocaleDateString('es-ES')}</td>
                  <td>
                    {m.role !== 'owner' && (
                      <div className="td-actions">
                        <button className="btn btn-sm btn-outline" onClick={() => { setEditing(m); setModal(true); }}>
                          <i className="fa-solid fa-pen"></i> Rol
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => removeMember(m.id)}>
                          <i className="fa-solid fa-user-minus"></i>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <InviteModal
          member={editing}
          businessId={business?.id}
          onClose={() => { setModal(false); setEditing(null); }}
          onSaved={() => { setModal(false); setEditing(null); load(); toast(editing ? 'Rol actualizado' : 'Invitación enviada', 'success'); }}
        />
      )}
    </div>
  );
}

function InviteModal({ member, businessId, onClose, onSaved }) {
  const [email, setEmail] = useState('');
  const [role, setRole]   = useState(member?.role || 'atc');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (member?.id) await bizApi.updateMember(businessId, member.id, { role });
      else await bizApi.inviteMember(businessId, { email, role });
      onSaved();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal open title={member ? 'Cambiar Rol' : 'Invitar Miembro'} onClose={onClose} size="modal-sm"
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Guardando...' : member ? 'Actualizar' : 'Invitar'}</button></>}>
      {!member && (
        <div className="form-group">
          <label className="form-label">Email del usuario *</label>
          <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@email.com" />
          <div className="form-hint">El usuario debe tener una cuenta en LiquidPOS</div>
        </div>
      )}
      <div className="form-group">
        <label className="form-label">Rol</label>
        <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="admin">Administrador — gestión completa</option>
          <option value="moderator">Moderador — productos e inventario</option>
          <option value="atc">ATC — facturación y clientes</option>
          <option value="viewer">Visor — solo lectura</option>
        </select>
        <div className="form-hint">Los permisos se configuran automáticamente según el rol elegido</div>
      </div>
    </Modal>
  );
}
