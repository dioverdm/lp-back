import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useApp, useToast } from '../../context/AppContext.jsx';

const ROLES = ['manager','accountant','cashier','waiter','warehouse'];
const ROLE_LABELS = { owner:'Dueño', manager:'Gerente', accountant:'Contador', cashier:'Cajero', waiter:'Mesonero', warehouse:'Bodeguero' };
const ROLE_COLORS = { owner:'badge-success', manager:'badge-info', accountant:'badge-warning', cashier:'badge-neutral', waiter:'badge-neutral', warehouse:'badge-neutral' };

function InviteModal({ onClose, onInvite }) {
  const [form, setForm] = useState({ email:'', role:'cashier', rank_label:'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await onInvite(form); onClose(); }
    catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal animate-scale-in">
        <div className="modal-header">
          <span className="modal-title">Invitar miembro</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input className="form-input" type="email" placeholder="colaborador@empresa.com"
                value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Rol</label>
              <select className="form-select" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              <span className="form-hint">
                {form.role==='manager' && 'Acceso total excepto eliminar empresa o cambiar suscripción'}
                {form.role==='cashier' && 'Puede crear pedidos, cobrar y cerrar caja'}
                {form.role==='waiter' && 'Solo puede crear pedidos y enviarlos a caja'}
                {form.role==='warehouse' && 'Acceso completo al módulo de inventario'}
                {form.role==='accountant' && 'Solo acceso a reportes y contabilidad'}
              </span>
            </div>
            <div className="form-group">
              <label className="form-label">Rango / etiqueta (opcional)</label>
              <input className="form-input" placeholder="Ej: Cajero Senior, Jefe de Bodega..."
                value={form.rank_label} onChange={e=>setForm(f=>({...f,rank_label:e.target.value}))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner spinner-sm"/> : '📨 Enviar invitación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState(null);
  const { state } = useApp();
  const { toast } = useToast();
  const isOwner = state.company?.role === 'owner';
  const canInvite = ['owner','manager'].includes(state.company?.role);

  const fetch = async () => {
    setLoading(true);
    try { setMembers(await api.get('/users/members') || []); }
    catch (err) { toast(err.message,'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [state.company?.id]);

  const handleInvite = async (form) => {
    const data = await api.post('/users/members/invite', form);
    setInviteLink(data.link || data.token);
    toast('Invitación generada','success');
    fetch();
  };

  const handleRemove = async (userId) => {
    if (!confirm('¿Remover este miembro?')) return;
    await api.delete(`/users/members/${userId}`);
    toast('Miembro removido','success');
    fetch();
  };

  const handleRoleChange = async (userId, role) => {
    await api.put(`/users/members/${userId}`, { role });
    toast('Rol actualizado','success');
    fetch();
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Equipo</h1>
          <p>{members.length} miembro{members.length!==1?'s':''} en {state.company?.name}</p>
        </div>
        <div className="page-header-actions">
          {canInvite && (
            <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Invitar miembro
            </button>
          )}
        </div>
      </div>

      {inviteLink && (
        <div className="card" style={{ marginBottom:16, background:'var(--color-success-bg)', border:'1px solid var(--brand-primary)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <span style={{ fontSize:20 }}>🔗</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--brand-dark)', marginBottom:4 }}>Invitación generada</div>
              <code style={{ fontSize:12, background:'var(--bg-surface)', padding:'4px 8px', borderRadius:6, wordBreak:'break-all', display:'block' }}>
                {window.location.origin}/invite/{inviteLink}
              </code>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteLink}`); toast('Copiado','success'); }}>
              📋 Copiar
            </button>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setInviteLink(null)}>✕</button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding:0 }}>
        <div className="table-wrapper" style={{ border:'none', borderRadius:'var(--radius-lg)' }}>
          <table className="data-table">
            <thead>
              <tr><th>Miembro</th><th>Email</th><th>Rol</th><th>Rango</th><th>Desde</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding:48, textAlign:'center' }}><div className="spinner spinner-md" style={{ margin:'0 auto' }}/></td></tr>
              ) : members.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div className="avatar avatar-sm" style={{ background:'var(--brand-light)', color:'var(--brand-dark)' }}>
                        {m.name?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight:600, fontSize:13 }}>{m.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize:12, color:'var(--text-muted)' }}>{m.email}</td>
                  <td>
                    {isOwner && m.role !== 'owner' ? (
                      <select
                        className="form-select"
                        style={{ padding:'4px 8px', fontSize:12, width:'auto', minWidth:110 }}
                        value={m.role}
                        onChange={e => handleRoleChange(m.id, e.target.value)}
                      >
                        {Object.entries(ROLE_LABELS).filter(([r]) => r!=='owner').map(([r,l]) => (
                          <option key={r} value={r}>{l}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`badge ${ROLE_COLORS[m.role]||'badge-neutral'}`}>{ROLE_LABELS[m.role]||m.role}</span>
                    )}
                  </td>
                  <td style={{ fontSize:12, color:'var(--text-muted)' }}>{m.rank_label || '—'}</td>
                  <td style={{ fontSize:12, color:'var(--text-muted)' }}>
                    {new Date(m.joined_at).toLocaleDateString('es-VE')}
                  </td>
                  <td>
                    {isOwner && m.role !== 'owner' && m.id !== state.user?.id && (
                      <button className="btn btn-ghost btn-sm" style={{ color:'var(--color-danger)' }} onClick={() => handleRemove(m.id)}>
                        Remover
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvite={handleInvite}
        />
      )}
    </div>
  );
}
