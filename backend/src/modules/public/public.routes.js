import { Router } from 'express';
import { query } from '../../config/db.js';

const router = Router();
const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res); } catch(e) { next(e); }
};

router.get('/:slug', wrap(async (req, res) => {
  const [company] = await query(
    'SELECT id, name, slug, logo_url, phone, whatsapp, address, currency FROM companies WHERE slug=? AND is_active=TRUE',
    [req.params.slug]
  );
  if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });

  const categories = await query(
    'SELECT * FROM categories WHERE company_id=? AND is_active=TRUE ORDER BY sort_order, name',
    [company.id]
  );
  const products = await query(
    `SELECT p.id, p.name, p.price, p.image_url, p.unit, p.description, p.category_id
     FROM products p WHERE p.company_id=? AND p.is_active=TRUE AND p.is_public=TRUE ORDER BY p.name`,
    [company.id]
  );

  res.json({ company, categories, products });
}));

export default router;
