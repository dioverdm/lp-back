import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query, transaction } from '../../config/db.js';

const SECRET = process.env.JWT_SECRET || 'liquidpos-secret-dev';

export const generateTokens = (userId) => {
  const accessToken  = jwt.sign({ userId }, SECRET, { expiresIn: '15m' });
  const refreshToken = crypto.randomBytes(48).toString('hex');
  return { accessToken, refreshToken };
};

export const register = async ({ name, email, password }) => {
  const exists = await query('SELECT id FROM users WHERE email = ?', [email]);
  if (exists.length) throw { status: 409, message: 'Email ya registrado' };

  const hash         = await bcrypt.hash(password, 12);
  const verify_token = crypto.randomBytes(32).toString('hex');

  const result = await query(
    'INSERT INTO users (name, email, password_hash, verify_token, is_verified) VALUES (?,?,?,?,1)',
    [name, email, hash, verify_token]
  );
  return { userId: result.insertId };
};

export const login = async ({ email, password }) => {
  const [user] = await query(
    'SELECT id, password_hash, name, avatar_url, is_verified FROM users WHERE email = ?',
    [email]
  );
  if (!user) throw { status: 401, message: 'Credenciales inválidas' };

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw { status: 401, message: 'Credenciales inválidas' };

  const companies = await query(
    `SELECT c.id, c.slug, c.name, c.logo_url, c.plan, cm.role
     FROM companies c JOIN company_members cm ON cm.company_id = c.id
     WHERE cm.user_id = ? AND cm.is_active = TRUE AND c.is_active = TRUE`,
    [user.id]
  );

  const { accessToken, refreshToken } = generateTokens(user.id);
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?,?,?)',
    [user.id, tokenHash, expiresAt]
  );

  return {
    accessToken, refreshToken,
    user: { id: user.id, name: user.name, email, avatar_url: user.avatar_url },
    companies,
  };
};

export const refresh = async (refreshToken) => {
  if (!refreshToken) throw { status: 401, message: 'Refresh token requerido' };
  const hash    = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const [stored] = await query(
    'SELECT user_id FROM refresh_tokens WHERE token_hash = ? AND expires_at > NOW()',
    [hash]
  );
  if (!stored) throw { status: 401, message: 'Refresh token inválido' };

  await query('DELETE FROM refresh_tokens WHERE token_hash = ?', [hash]);

  const { accessToken, refreshToken: newRefresh } = generateTokens(stored.user_id);
  const newHash   = crypto.createHash('sha256').update(newRefresh).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?,?,?)',
    [stored.user_id, newHash, expiresAt]
  );

  return { accessToken, refreshToken: newRefresh };
};

export const createCompany = async (userId, { name, slug, country, currency, whatsapp }) => {
  const existing = await query('SELECT id FROM companies WHERE slug = ?', [slug]);
  if (existing.length) throw { status: 409, message: 'Ese slug ya existe' };

  return transaction(async (conn) => {
    const [res] = await conn.execute(
      'INSERT INTO companies (name, slug, country, currency, whatsapp) VALUES (?,?,?,?,?)',
      [name, slug, country || 'VE', currency || 'USD', whatsapp || null]
    );
    const companyId = res.insertId;

    await conn.execute(
      "INSERT INTO company_members (company_id, user_id, role) VALUES (?,?,'owner')",
      [companyId, userId]
    );
    await conn.execute(
      "INSERT INTO branches (company_id, name) VALUES (?,?)",
      [companyId, 'Principal']
    );
    return { companyId, slug };
  });
};
