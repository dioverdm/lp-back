import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useApp, useTheme, useToast } from '../../context/AppContext.jsx';

export default function Settings() {
  const { state, dispatch } = useApp();
  const { theme, toggle } = useTheme();
  const { toast } = useToast();
  const company = state.company;
  const [form, setForm] = useState({
    name: company?.name || '',
    currency: company?.currency || 'USD',
    tax_rate: company?.tax_rate || 16,
    phone: '', whatsapp: company?.whatsapp || '',
    address: '', logo_url: company?.logo_url || '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/users/company', form);
      toast('Configuración guardada','success');
      // Update local state
      dispatch({ type:'SET_COMPANY', payload: { ...company, ...form } });
    } catch (err) { toast(err.message,'error'); }
    finally { setLoading(false); }
  };

  const canEdit = ['owner','manager'].includes(company?.role);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Configuración</h1>
          <p>Ajusta los datos de tu empresa</p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, alignItems:'start' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">🏢 Datos de la empresa</span>
          </div>
          <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-group">
              <label className="form-label">Nombre comercial</label>
              <input className="form-input" value={form.name} onChange={e=>set('name',e.target.value)} disabled={!canEdit} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="form-label">Moneda</label>
                <select className="form-select" value={form.currency} onChange={e=>set('currency',e.target.value)} disabled={!canEdit}>
                  {[['USD','USD $'],['VES','VES Bs.'],['COP','COP $'],['MXN','MXN $'],['PEN','PEN S/'],['CLP','CLP $'],['ARS','ARS $']].map(([v,l])=>
                    <option key={v} value={v}>{l}</option>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">IVA por defecto (%)</label>
                <input className="form-input" type="number" min="0" max="100" step="0.01"
                  value={form.tax_rate} onChange={e=>set('tax_rate',e.target.value)} disabled={!canEdit} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" type="tel" placeholder="+58 212 1234567"
                  value={form.phone} onChange={e=>set('phone',e.target.value)} disabled={!canEdit} />
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp</label>
                <input className="form-input" type="tel" placeholder="+58 412 1234567"
                  value={form.whatsapp} onChange={e=>set('whatsapp',e.target.value)} disabled={!canEdit} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Logo URL</label>
              <input className="form-input" placeholder="https://..." value={form.logo_url} onChange={e=>set('logo_url',e.target.value)} disabled={!canEdit} />
            </div>
            <div className="form-group">
              <label className="form-label">Dirección</label>
              <textarea className="form-textarea" value={form.address} onChange={e=>set('address',e.target.value)} disabled={!canEdit} />
            </div>
            {canEdit && (
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ alignSelf:'flex-start' }}>
                {loading ? <div className="spinner spinner-sm"/> : '💾 Guardar cambios'}
              </button>
            )}
          </form>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Vitrina pública */}
          <div className="card">
            <div className="card-header"><span className="card-title">🌐 Vitrina pública</span></div>
            <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:12 }}>
              Tu catálogo está disponible en:
            </p>
            <code style={{ display:'block', padding:'8px 12px', background:'var(--bg-surface-2)', borderRadius:'var(--radius-md)', fontSize:12, wordBreak:'break-all', marginBottom:12, border:'1px solid var(--border-color)' }}>
              {window.location.origin}/@{company?.slug}
            </code>
            <button className="btn btn-secondary btn-sm" style={{ width:'100%' }}
              onClick={() => window.open(`/@${company?.slug}`, '_blank')}>
              👁 Ver vitrina
            </button>
          </div>

          {/* Apariencia */}
          <div className="card">
            <div className="card-header"><span className="card-title">🎨 Apariencia</span></div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 0' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>Modo {theme === 'light' ? 'claro' : 'oscuro'}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>Alterna el tema visual</div>
              </div>
              <button className={`theme-toggle ${theme==='dark'?'active':''}`} onClick={toggle}>
                <div className="theme-toggle-thumb"/>
              </button>
            </div>
          </div>

          {/* Plan */}
          <div className="card" style={{ background:'linear-gradient(135deg, var(--brand-darker), var(--brand-dark))', color:'#fff', border:'none' }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, opacity:0.7, marginBottom:4 }}>Plan actual</div>
            <div style={{ fontSize:24, fontWeight:800, textTransform:'capitalize', marginBottom:4 }}>
              {company?.plan || 'Free'}
            </div>
            <div style={{ fontSize:12, opacity:0.75, marginBottom:16 }}>
              {company?.plan==='free' ? 'Hasta 100 productos y 1 sucursal' : 'Plan activo'}
            </div>
            <button className="btn" style={{ background:'rgba(255,255,255,0.2)', color:'#fff', width:'100%', backdropFilter:'blur(10px)' }}>
              🚀 Mejorar plan
            </button>
          </div>

          {/* Cuenta */}
          <div className="card">
            <div className="card-header"><span className="card-title">👤 Mi cuenta</span></div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div className="avatar avatar-lg">{state.user?.name?.charAt(0)}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>{state.user?.name}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{state.user?.email}</div>
              </div>
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)', fontStyle:'italic' }}>
              Rol: <b style={{ color:'var(--brand-primary)' }}>{company?.role}</b> en {company?.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
