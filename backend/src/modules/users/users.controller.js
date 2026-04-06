// users.controller.js
import crypto from 'crypto';
import { query } from '../../config/db.js';

const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res); } catch(e) { next(e); }
};

export const listMembers = wrap(async (req, res) => {
  const members = await query(
    `SELECT u.id, u.name, u.email, u.avatar_url, cm.role, cm.rank_label, cm.joined_at, cm.is_active
     FROM company_members cm JOIN users u ON u.id=cm.user_id
     WHERE cm.company_id=? ORDER BY cm.role, u.name`,
    [req.company.id]
  );
  res.json(members);
});

export const inviteMember = wrap(async (req, res) => {
  if (!['owner','manager'].includes(req.company.role))
    return res.status(403).json({ error: 'Sin permisos para invitar' });

  const { email, role, rank_label } = req.body;
  if (req.company.role === 'manager' && ['owner','manager'].includes(role))
    return res.status(403).json({ error: 'No puedes asignar ese rol' });

  const token    = crypto.randomBytes(32).toString('hex');
  const expiresAt= new Date(Date.now() + 7*24*60*60*1000);

  await query(
    `INSERT INTO invitations (company_id, invited_by, email, role, rank_label, token, expires_at)
     VALUES (?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE token=VALUES(token), expires_at=VALUES(expires_at), role=VALUES(role), accepted_at=NULL`,
    [req.company.id, req.user.id, email, role, rank_label||null, token, expiresAt]
  );

  res.json({ message: 'Invitación generada', token, link: `/invite/${token}` });
});

export const acceptInvitation = wrap(async (req, res) => {
  const { token } = req.params;
  const [inv] = await query(
    "SELECT * FROM invitations WHERE token=? AND expires_at>NOW() AND accepted_at IS NULL", [token]
  );
  if (!inv) return res.status(400).json({ error: 'Invitación inválida o expirada' });

  const [user] = await query('SELECT id FROM users WHERE email=?', [inv.email]);
  if (!user) return res.json({ redirect: `/register?invite=${token}&email=${inv.email}` });

  await query(
    `INSERT INTO company_members (company_id, user_id, role, rank_label)
     VALUES (?,?,?,?)
     ON DUPLICATE KEY UPDATE role=VALUES(role), rank_label=VALUES(rank_label), is_active=TRUE`,
    [inv.company_id, user.id, inv.role, inv.rank_label]
  );
  await query('UPDATE invitations SET accepted_at=NOW() WHERE id=?', [inv.id]);
  res.json({ message: 'Unido exitosamente', company_id: inv.company_id });
});

export const updateMember = wrap(async (req, res) => {
  if (req.company.role !== 'owner') return res.status(403).json({ error: 'Solo el dueño puede cambiar roles' });
  const { role, rank_label } = req.body;
  await query(
    'UPDATE company_members SET role=?, rank_label=? WHERE company_id=? AND user_id=?',
    [role, rank_label||null, req.company.id, req.params.userId]
  );
  res.json({ message: 'Rol actualizado' });
});

export const removeMember = wrap(async (req, res) => {
  if (req.company.role !== 'owner') return res.status(403).json({ error: 'Sin permisos' });
  await query('UPDATE company_members SET is_active=FALSE WHERE company_id=? AND user_id=?',
    [req.company.id, req.params.userId]);
  res.json({ message: 'Miembro removido' });
});

export const getBranches = wrap(async (req, res) => {
  const branches = await query(
    'SELECT * FROM branches WHERE company_id=? AND is_active=TRUE ORDER BY name',
    [req.company.id]
  );
  res.json(branches);
});

export const createBranch = wrap(async (req, res) => {
  const { name, address, phone } = req.body;
  const result = await query(
    'INSERT INTO branches (company_id, name, address, phone) VALUES (?,?,?,?)',
    [req.company.id, name, address||null, phone||null]
  );
  res.status(201).json({ id: result.insertId, name });
});

export const updateCompany = wrap(async (req, res) => {
  if (!['owner','manager'].includes(req.company.role))
    return res.status(403).json({ error: 'Sin permisos' });

  const { name, phone, whatsapp, address, currency, tax_rate, logo_url } = req.body;
  await query(
    'UPDATE companies SET name=?, phone=?, whatsapp=?, address=?, currency=?, tax_rate=?, logo_url=? WHERE id=?',
    [name, phone||null, whatsapp||null, address||null, currency||'USD', tax_rate||0, logo_url||null, req.company.id]
  );
  res.json({ message: 'Empresa actualizada' });
});
