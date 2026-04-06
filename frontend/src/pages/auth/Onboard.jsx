import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setCompanyId } from '../../services/api.js';
import { useApp, useToast } from '../../context/AppContext.jsx';

export default function Onboard() {
  const [step, setStep]     = useState(1);
  const [form, setForm]     = useState({ name:'', slug:'', country:'VE', currency:'USD', whatsapp:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const { dispatch, state } = useApp();
  const { toast }           = useToast();
  const navigate            = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const autoSlug = (name) => {
    const s = name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
    set('slug', s); set('name', name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await api.post('/auth/companies', form);
      setCompanyId(data.companyId);
      const companies = await api.get('/auth/me/companies');
      const company = companies.find(c => c.id === data.companyId) || companies[0];
      dispatch({ type: 'SET_SESSION', payload: { user: state.user, companies, company, token: state.token } });
      toast('¡Empresa creada exitosamente!', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-base)', padding:24 }}>
      <div className="animate-scale-in" style={{ width:'100%', maxWidth:480 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div className="logo-mark" style={{ justifyContent:'center', marginBottom:16 }}>
            <div className="logo-icon" style={{ width:48, height:48, fontSize:24 }}>L</div>
          </div>
          <h1 style={{ fontSize:26, fontWeight:800, color:'var(--text-primary)', marginBottom:6 }}>Configura tu empresa</h1>
          <p style={{ color:'var(--text-muted)', fontSize:14 }}>Solo te tomará 1 minuto configurar tu negocio</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {error && (
              <div style={{ background:'var(--color-danger-bg)',color:'var(--color-danger)',padding:'10px 14px',borderRadius:'var(--radius-md)',fontSize:13 }}>{error}</div>
            )}

            <div className="form-group">
              <label className="form-label">Nombre de tu negocio</label>
              <input className="form-input" placeholder="Ej: Café El Molino" value={form.name}
                onChange={e => autoSlug(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">URL de tu tienda</label>
              <div style={{ display:'flex', alignItems:'center', background:'var(--bg-surface-3)', border:'1.5px solid var(--border-color)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
                <span style={{ padding:'10px 12px', fontSize:13, color:'var(--text-muted)', background:'var(--bg-surface-2)', borderRight:'1px solid var(--border-color)', whiteSpace:'nowrap' }}>
                  liquidpos.app/@
                </span>
                <input className="form-input" style={{ border:'none', borderRadius:0, background:'transparent' }}
                  placeholder="mi-negocio" value={form.slug}
                  onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))}
                  required />
              </div>
              <span className="form-hint">Solo letras minúsculas, números y guiones</span>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="form-label">País</label>
                <select className="form-select" value={form.country} onChange={e => set('country', e.target.value)}>
                  <option value="VE">Venezuela 🇻🇪</option>
                  <option value="CO">Colombia 🇨🇴</option>
                  <option value="MX">México 🇲🇽</option>
                  <option value="PE">Perú 🇵🇪</option>
                  <option value="CL">Chile 🇨🇱</option>
                  <option value="AR">Argentina 🇦🇷</option>
                  <option value="US">USA 🇺🇸</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Moneda</label>
                <select className="form-select" value={form.currency} onChange={e => set('currency', e.target.value)}>
                  <option value="USD">USD $</option>
                  <option value="VES">VES Bs.</option>
                  <option value="COP">COP $</option>
                  <option value="MXN">MXN $</option>
                  <option value="PEN">PEN S/</option>
                  <option value="CLP">CLP $</option>
                  <option value="ARS">ARS $</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">WhatsApp de contacto (opcional)</label>
              <input className="form-input" type="tel" placeholder="+58 412 1234567"
                value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
              <span className="form-hint">Los clientes serán redirigidos aquí desde tu vitrina pública</span>
            </div>

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width:'100%', marginTop:8 }}>
              {loading ? <div className="spinner spinner-sm" /> : '🚀 Crear mi empresa'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
