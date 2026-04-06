import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { setToken } from '../../services/api.js';
import { useApp, useToast } from '../../context/AppContext.jsx';

export default function Register() {
  const [form, setForm]     = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const { dispatch }        = useApp();
  const { toast }           = useToast();
  const navigate            = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden');
    setError(''); setLoading(true);
    try {
      await api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
      const data = await api.post('/auth/login', { email: form.email, password: form.password });
      setToken(data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      dispatch({ type: 'SET_SESSION', payload: { user: data.user, companies: [], company: null, token: data.accessToken } });
      toast('¡Cuenta creada exitosamente!', 'success');
      navigate('/onboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div className="auth-visual-logo">Liquid<span>POS</span></div>
          <div className="auth-visual-tagline">Empieza gratis hoy</div>
          <div className="auth-visual-sub">Sin tarjeta de crédito requerida</div>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-form-card animate-fade-in">
          <h1 className="auth-form-title">Crear cuenta</h1>
          <p className="auth-form-sub">Únete a LiquidPOS en segundos</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div style={{ background:'var(--color-danger-bg)',color:'var(--color-danger)',padding:'10px 14px',borderRadius:'var(--radius-md)',fontSize:13,fontWeight:500 }}>{error}</div>
            )}
            {[
              { key:'name',  label:'Nombre completo',       type:'text',     ph:'Juan Pérez', icon:<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>, icon2:<circle cx="12" cy="7" r="4"/> },
              { key:'email', label:'Correo electrónico',    type:'email',    ph:'tu@empresa.com', icon:<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>, icon2:<polyline points="22,6 12,13 2,6"/> },
              { key:'password',label:'Contraseña',          type:'password', ph:'Mínimo 8 caracteres', icon:<rect x="3" y="11" width="18" height="11" rx="2"/>, icon2:<path d="M7 11V7a5 5 0 0110 0v4"/> },
              { key:'confirm', label:'Confirmar contraseña',type:'password', ph:'Repite la contraseña', icon:<rect x="3" y="11" width="18" height="11" rx="2"/>, icon2:<path d="M7 11V7a5 5 0 0110 0v4"/> },
            ].map(({ key, label, type, ph }) => (
              <div key={key} className="form-group">
                <label className="form-label">{label}</label>
                <input
                  className="form-input"
                  type={type}
                  placeholder={ph}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  required
                />
              </div>
            ))}
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width:'100%' }}>
              {loading ? <div className="spinner spinner-sm" /> : 'Crear cuenta gratis'}
            </button>
          </form>
          <p className="auth-link">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
        </div>
      </div>
    </div>
  );
}
