import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { businesses as bizApi } from '../api';

export function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { businesses } = await login(form);
      navigate(businesses.length ? '/' : '/onboarding');
    } catch (err) { setError(err.message || 'Credenciales inválidas'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-aside">
        <div className="auth-aside-logo">⚡ LiquidPOS</div>
        <h2>Gestiona tu negocio con precisión</h2>
        <p>Inventario, facturación y estadísticas para empresas de todos los tamaños.</p>
        <div className="auth-feature"><i className="fa-solid fa-check-circle"></i> Múltiples empresas en una cuenta</div>
        <div className="auth-feature"><i className="fa-solid fa-check-circle"></i> Facturación con lector de barras</div>
        <div className="auth-feature"><i className="fa-solid fa-check-circle"></i> Catálogo público por empresa</div>
        <div className="auth-feature"><i className="fa-solid fa-check-circle"></i> Roles y permisos granulares</div>
      </div>
      <div className="auth-form-side">
        <h1>Bienvenido de vuelta</h1>
        <p>Ingresa a tu cuenta para continuar</p>
        {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: '.85rem' }}>{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={form.email} onChange={f('email')} placeholder="tu@email.com" required /></div>
          <div className="form-group"><label className="form-label">Contraseña</label><input className="form-control" type="password" value={form.password} onChange={f('password')} placeholder="••••••••" required /></div>
          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading} style={{ marginTop: 8 }}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
        </form>
        <p style={{ marginTop: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '.88rem' }}>
          ¿No tienes cuenta? <button className="auth-link" onClick={() => navigate('/register')}>Regístrate gratis</button>
        </p>
      </div>
    </div>
  );
}

export function Register() {
  const { register } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setError('La contraseña debe tener mínimo 6 caracteres'); return; }
    setLoading(true); setError('');
    try { await register(form); navigate('/onboarding'); }
    catch (err) { setError(err.message || 'Error al registrarse'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-aside">
        <div className="auth-aside-logo">⚡ LiquidPOS</div>
        <h2>Empieza gratis hoy</h2>
        <p>Configura tu empresa en minutos y empieza a facturar.</p>
        <div className="auth-feature"><i className="fa-solid fa-check-circle"></i> Plan gratuito sin tarjeta</div>
        <div className="auth-feature"><i className="fa-solid fa-check-circle"></i> Hasta 50 productos</div>
        <div className="auth-feature"><i className="fa-solid fa-check-circle"></i> 30 facturas mensuales gratis</div>
      </div>
      <div className="auth-form-side">
        <h1>Crear cuenta</h1>
        <p>Completa el formulario para comenzar</p>
        {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: '.85rem' }}>{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group"><label className="form-label">Nombre completo</label><input className="form-control" value={form.name} onChange={f('name')} placeholder="Juan García" required /></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={form.email} onChange={f('email')} placeholder="tu@email.com" required /></div>
          <div className="form-group"><label className="form-label">Contraseña</label><input className="form-control" type="password" value={form.password} onChange={f('password')} placeholder="Mínimo 6 caracteres" required /></div>
          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading} style={{ marginTop: 8 }}>{loading ? 'Registrando...' : 'Crear cuenta gratis'}</button>
        </form>
        <p style={{ marginTop: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '.88rem' }}>
          ¿Ya tienes cuenta? <button className="auth-link" onClick={() => navigate('/login')}>Inicia sesión</button>
        </p>
      </div>
    </div>
  );
}

export function Onboarding() {
  const { refreshBizList, toast } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', slug: '', description: '', currency: 'USD', taxRate: '0', taxLabel: 'IVA' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const autoSlug = (name) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').slice(0, 30);
  const handleName = (e) => { const name = e.target.value; setForm((p) => ({ ...p, name, slug: autoSlug(name) })); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.slug) { setError('Nombre y slug son requeridos'); return; }
    setLoading(true); setError('');
    try {
      await bizApi.create({ ...form, taxRate: parseFloat(form.taxRate) || 0 });
      await refreshBizList();
      toast('¡Empresa creada exitosamente!', 'success');
      navigate('/');
    } catch (err) { setError(err.message || 'Error al crear empresa'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', padding: 40, maxWidth: 500, width: '100%', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🏢</div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800 }}>Configura tu empresa</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>Estos datos aparecerán en tus facturas y catálogo</p>
        </div>
        {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: '.85rem' }}>{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group"><label className="form-label">Nombre de la empresa *</label><input className="form-control" value={form.name} onChange={handleName} placeholder="Mi Tienda" required /></div>
          <div className="form-group">
            <label className="form-label">Slug — URL del catálogo</label>
            <div style={{ display: 'flex' }}>
              <span style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRight: 'none', borderRadius: '10px 0 0 10px', padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: '.82rem', color: 'var(--text-secondary)' }}>/@</span>
              <input className="form-control" style={{ borderRadius: '0 10px 10px 0' }} value={form.slug} onChange={f('slug')} placeholder="mi-tienda" required />
            </div>
            <div className="form-hint">Tu catálogo: <strong>tu-dominio.com/@{form.slug || 'mi-tienda'}</strong></div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Moneda</label>
              <select className="form-control" value={form.currency} onChange={f('currency')}>
                <option value="USD">USD — Dólar</option><option value="VES">VES — Bolívar</option>
                <option value="COP">COP — Peso Col.</option><option value="MXN">MXN — Peso Mex.</option>
                <option value="PEN">PEN — Sol</option><option value="EUR">EUR — Euro</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Impuesto %</label><input className="form-control" type="number" step="0.01" min="0" max="100" value={form.taxRate} onChange={f('taxRate')} placeholder="16" /></div>
          </div>
          <div className="form-group"><label className="form-label">Etiqueta del impuesto</label><input className="form-control" value={form.taxLabel} onChange={f('taxLabel')} placeholder="IVA / IGV / IVA..." /></div>
          <div className="form-group"><label className="form-label">Descripción (opcional)</label><textarea className="form-control" value={form.description} onChange={f('description')} rows={2} placeholder="Describe tu negocio..." /></div>
          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading} style={{ marginTop: 8 }}>{loading ? 'Creando empresa...' : '✓ Crear empresa y comenzar'}</button>
        </form>
      </div>
    </div>
  );
}
