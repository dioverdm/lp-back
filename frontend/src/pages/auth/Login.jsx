import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { setToken } from '../../services/api.js';
import { useApp, useToast } from '../../context/AppContext.jsx';

export default function Login() {
  const [form, setForm]     = useState({ email: 'admin@demo.com', password: 'Admin123!' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const { dispatch }        = useApp();
  const { toast }           = useToast();
  const navigate            = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await api.post('/auth/login', form);
      setToken(data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      const company = data.companies[0] || null;
      if (company) {
        localStorage.setItem('company_id', company.id);
        const { setCompanyId } = await import('../../services/api.js');
        setCompanyId(company.id);
      }
      dispatch({ type: 'SET_SESSION', payload: { user: data.user, companies: data.companies, company, token: data.accessToken } });
      toast('¡Bienvenido de vuelta!', 'success');
      navigate(company ? '/dashboard' : '/onboard');
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
          <div className="auth-visual-tagline">Tu negocio, bajo control</div>
          <div className="auth-visual-sub">Sistema POS SaaS de nueva generación</div>
          <div className="auth-visual-features">
            {[
              ['🛒', 'Punto de venta táctil e intuitivo'],
              ['📦', 'Control de inventario en tiempo real'],
              ['📊', 'Estadísticas e IA integrada'],
              ['🌐', 'Vitrina pública con integración WhatsApp'],
            ].map(([icon, text]) => (
              <div key={text} className="auth-feature">
                <div className="auth-feature-icon">{icon}</div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-card animate-fade-in">
          <h1 className="auth-form-title">Iniciar sesión</h1>
          <p className="auth-form-sub">Accede a tu panel de LiquidPOS</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: 'var(--color-danger-bg)', color: 'var(--color-danger)',
                padding: '10px 14px', borderRadius: 'var(--radius-md)',
                fontSize: 13, fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <div className="input-prefix-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input
                  className="form-input"
                  type="email"
                  placeholder="tu@empresa.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div className="input-prefix-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? <div className="spinner spinner-sm" /> : 'Entrar'}
            </button>
          </form>

          <p className="auth-link">
            ¿No tienes cuenta? <Link to="/register">Regístrate gratis</Link>
          </p>

          <div style={{ marginTop: 20, padding: 12, background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Demo</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Email: <b>admin@demo.com</b></p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Password: <b>Admin123!</b></p>
          </div>
        </div>
      </div>
    </div>
  );
}
