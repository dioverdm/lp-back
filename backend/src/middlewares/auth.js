import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../config/db.js';

export const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token requerido' });

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'liquidpos-secret-dev');
    const [user]  = await query(
      'SELECT id, name, email, avatar_url, is_verified FROM users WHERE id = ?',
      [decoded.userId]
    );
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

export const withCompany = async (req, res, next) => {
  const companyId = req.headers['x-company-id'] || req.params.companyId;
  if (!companyId) return res.status(400).json({ error: 'company_id requerido' });

  const [member] = await query(
    `SELECT cm.role, cm.rank_label, c.id, c.slug, c.name as company_name,
            c.settings, c.currency, c.tax_rate, c.plan, c.whatsapp, c.logo_url
     FROM company_members cm
     JOIN companies c ON c.id = cm.company_id
     WHERE cm.company_id = ? AND cm.user_id = ? AND cm.is_active = TRUE AND c.is_active = TRUE`,
    [companyId, req.user.id]
  );

  if (!member) return res.status(403).json({ error: 'Acceso denegado a esta empresa' });

  req.company = {
    id:           Number(companyId),
    slug:         member.slug,
    name:         member.company_name,
    role:         member.role,
    rank:         member.rank_label,
    currency:     member.currency,
    tax_rate:     member.tax_rate,
    plan:         member.plan,
    whatsapp:     member.whatsapp,
    logo_url:     member.logo_url,
    settings:     member.settings ? JSON.parse(member.settings) : {},
  };
  next();
};

// RBAC permissions map
const ROLE_PERMISSIONS = {
  owner:       ['*'],
  manager:     ['products.*','catalog.*','orders.*','inventory.*','suppliers.*',
                'members.read','members.invite','reports.*','branches.*','settings.read',
                'purchases.*','cash_sessions.*','pos.*'],
  accountant:  ['reports.*','accounting.*','orders.read'],
  cashier:     ['orders.*','pos.*','cash_sessions.*','products.read','catalog.read'],
  waiter:      ['orders.create','orders.read','products.read','catalog.read'],
  warehouse:   ['inventory.*','suppliers.*','purchases.*','products.read'],
};

export const can = (...permissions) => (req, res, next) => {
  if (!req.company) return res.status(403).json({ error: 'Sin contexto de empresa' });
  const allowed = ROLE_PERMISSIONS[req.company.role] || [];
  if (allowed.includes('*')) return next();

  const ok = permissions.some(perm => {
    const [mod] = perm.split('.');
    return allowed.includes(perm) || allowed.includes(`${mod}.*`);
  });

  if (!ok) return res.status(403).json({ error: `Rol "${req.company.role}" sin acceso` });
  next();
};
