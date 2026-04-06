// catalog.controller.js
import { query } from '../../config/db.js';

const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res); } catch(e) { next(e); }
};

// ── CATEGORÍAS ────────────────────────────────────────────────
export const listCategories = wrap(async (req, res) => {
  const rows = await query(
    'SELECT * FROM categories WHERE company_id = ? AND is_active = TRUE ORDER BY sort_order, name',
    [req.company.id]
  );
  res.json(rows);
});

export const createCategory = wrap(async (req, res) => {
  const { name, parent_id, image_url, sort_order } = req.body;
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const result = await query(
    'INSERT INTO categories (company_id, name, slug, parent_id, image_url, sort_order) VALUES (?,?,?,?,?,?)',
    [req.company.id, name, slug, parent_id || null, image_url || null, sort_order || 0]
  );
  res.status(201).json({ id: result.insertId, name, slug });
});

// ── PRODUCTOS ─────────────────────────────────────────────────
export const listProducts = wrap(async (req, res) => {
  const { page = 1, limit = 50, category_id, search, active } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const cid    = req.company.id;

  let sql = `
    SELECT p.id, p.name, p.sku, p.barcode, p.price, p.cost, p.tax_rate,
           p.unit, p.image_url, p.is_active, p.is_public, p.has_variants,
           c.name AS category_name,
           COALESCE((SELECT SUM(i.quantity) FROM inventory i WHERE i.product_id = p.id AND i.company_id = p.company_id), 0) AS stock
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.company_id = ?`;
  const params = [cid];

  if (category_id) { sql += ' AND p.category_id = ?';   params.push(category_id); }
  if (active !== undefined) { sql += ' AND p.is_active = ?'; params.push(active === 'true' ? 1 : 0); }
  if (search) { sql += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

  sql += ' ORDER BY p.name LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  const products = await query(sql, params);
  const [{ total }] = await query(
    'SELECT COUNT(*) as total FROM products WHERE company_id = ?', [cid]
  );
  res.json({ products, total: Number(total), page: Number(page), limit: Number(limit) });
});

export const searchProducts = wrap(async (req, res) => {
  const { q } = req.query;
  const cid   = req.company.id;
  if (!q) return res.json([]);

  const products = await query(
    `SELECT p.id, p.name, p.sku, p.barcode, p.price, p.tax_rate, p.image_url, p.unit, p.has_variants,
            COALESCE((SELECT SUM(i.quantity) FROM inventory i WHERE i.product_id = p.id AND i.company_id = p.company_id), 0) AS stock
     FROM products p
     WHERE p.company_id = ? AND p.is_active = TRUE
       AND (p.barcode = ? OR p.sku = ? OR p.name LIKE ?)
     LIMIT 20`,
    [cid, q, q, `%${q}%`]
  );
  res.json(products);
});

export const getProduct = wrap(async (req, res) => {
  const [product] = await query(
    `SELECT p.*, c.name AS category_name FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = ? AND p.company_id = ?`,
    [req.params.id, req.company.id]
  );
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

  const variants = await query('SELECT * FROM product_variants WHERE product_id = ?', [product.id]);
  res.json({ ...product, variants });
});

export const createProduct = wrap(async (req, res) => {
  const {
    name, sku, barcode, description, price, cost, category_id,
    tax_rate, unit, is_public, image_url, initial_stock, min_stock
  } = req.body;
  const cid = req.company.id;

  const result = await query(
    `INSERT INTO products (company_id, category_id, sku, barcode, name, description,
      price, cost, tax_rate, unit, is_public, image_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [cid, category_id || null, sku || null, barcode || null, name, description || null,
     price, cost || 0, tax_rate || null, unit || 'unit', is_public !== false ? 1 : 0, image_url || null]
  );
  const productId = result.insertId;

  if (initial_stock !== undefined) {
    const [branch] = await query('SELECT id FROM branches WHERE company_id = ? LIMIT 1', [cid]);
    if (branch) {
      await query(
        'INSERT INTO inventory (company_id, branch_id, product_id, quantity, min_stock) VALUES (?,?,?,?,?)',
        [cid, branch.id, productId, initial_stock, min_stock || 5]
      );
    }
  }
  res.status(201).json({ id: productId });
});

export const updateProduct = wrap(async (req, res) => {
  const { name, sku, barcode, description, price, cost, category_id,
    tax_rate, unit, is_public, is_active, image_url } = req.body;

  await query(
    `UPDATE products SET name=?, sku=?, barcode=?, description=?, price=?, cost=?,
     category_id=?, tax_rate=?, unit=?, is_public=?, is_active=?, image_url=?, updated_at=NOW()
     WHERE id = ? AND company_id = ?`,
    [name, sku || null, barcode || null, description || null, price, cost || 0,
     category_id || null, tax_rate || null, unit || 'unit',
     is_public !== false ? 1 : 0, is_active !== false ? 1 : 0, image_url || null,
     req.params.id, req.company.id]
  );
  res.json({ message: 'Producto actualizado' });
});

export const deleteProduct = wrap(async (req, res) => {
  await query('UPDATE products SET is_active = 0 WHERE id = ? AND company_id = ?',
    [req.params.id, req.company.id]);
  res.json({ message: 'Producto desactivado' });
});
