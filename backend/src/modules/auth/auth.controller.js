// auth.controller.js
import * as svc from './auth.service.js';
import { query } from '../../config/db.js';

const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res); } catch (e) { next(e); }
};

export const register = wrap(async (req, res) => {
  const data = await svc.register(req.body);
  res.status(201).json(data);
});

export const login = wrap(async (req, res) => {
  const data = await svc.login(req.body);
  res.json(data);
});

export const refreshToken = wrap(async (req, res) => {
  const data = await svc.refresh(req.body.refreshToken);
  res.json(data);
});

export const logout = wrap(async (req, res) => {
  // invalidar token en DB
  res.json({ message: 'Sesión cerrada' });
});

export const me = wrap(async (req, res) => {
  const companies = await query(
    `SELECT c.id, c.slug, c.name, c.logo_url, c.plan, c.currency, cm.role
     FROM companies c JOIN company_members cm ON cm.company_id = c.id
     WHERE cm.user_id = ? AND cm.is_active = TRUE`,
    [req.user.id]
  );
  res.json({ user: req.user, companies });
});

export const createCompany = wrap(async (req, res) => {
  const data = await svc.createCompany(req.user.id, req.body);
  res.status(201).json(data);
});

export const myCompanies = wrap(async (req, res) => {
  const companies = await query(
    `SELECT c.id, c.slug, c.name, c.logo_url, c.plan, c.currency, cm.role
     FROM companies c JOIN company_members cm ON cm.company_id = c.id
     WHERE cm.user_id = ? AND cm.is_active = TRUE`,
    [req.user.id]
  );
  res.json(companies);
});
