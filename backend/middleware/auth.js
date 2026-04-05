import jwt from 'jsonwebtoken';
import { dbGet } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'liquidpos-secret-change-in-prod';

export const signToken = (userId) =>
  jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });

export const requireAuth = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'No autorizado' });

  try {
    const token = auth.slice(7);
    const { sub } = jwt.verify(token, JWT_SECRET);
    const user = await dbGet('SELECT id, name, email, avatar, plan, active FROM users WHERE id = ?', [sub]);
    if (!user || !user.active) return res.status(401).json({ message: 'Usuario no válido' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// Carga el negocio activo desde header X-Business-Id
export const requireBusiness = async (req, res, next) => {
  const bId = req.headers['x-business-id'] || req.query.businessId;
  if (!bId) return res.status(400).json({ message: 'Se requiere X-Business-Id' });

  const member = await dbGet(
    `SELECT bm.role, bm.permissions, bm.status, b.id as bid, b.name as bname, b.slug, b.currency, b.tax_rate, b.tax_label
     FROM business_members bm
     JOIN businesses b ON b.id = bm.business_id
     WHERE bm.business_id = ? AND bm.user_id = ? AND bm.status = 'active' AND b.active = 1`,
    [bId, req.user.id]
  );
  if (!member) return res.status(403).json({ message: 'Acceso denegado a esta empresa' });

  req.business = { id: member.bid, name: member.bname, slug: member.slug, currency: member.currency, taxRate: member.tax_rate, taxLabel: member.tax_label };
  req.memberRole = member.role;
  req.memberPerms = member.permissions ? JSON.parse(member.permissions) : null;
  next();
};

// Permisos por rol
const ROLE_PERMS = {
  owner:     ['all'],
  admin:     ['products','inventory','invoices','customers','reports','members','discounts','warehouses','categories'],
  moderator: ['products','inventory','reports','discounts','categories'],
  atc:       ['invoices','customers','products:read'],
  viewer:    ['products:read','reports:read'],
};

export const requirePerm = (perm) => (req, res, next) => {
  const role  = req.memberRole;
  const perms = ROLE_PERMS[role] || [];
  if (perms.includes('all') || perms.includes(perm) || perms.includes(perm.split(':')[0])) return next();
  if (req.memberPerms?.includes(perm)) return next();
  return res.status(403).json({ message: `Permiso requerido: ${perm}` });
};
