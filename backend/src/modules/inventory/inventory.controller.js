// inventory.controller.js
import { query, transaction } from '../../config/db.js';

const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res); } catch (e) { next(e); }
};

export const getStock = wrap(async (req, res) => {
  const cid = req.company.id;
  const { branch_id, low_stock } = req.query;

  let sql = `
    SELECT p.id, p.name, p.sku, p.barcode, p.unit, p.image_url,
           i.branch_id, b.name AS branch_name,
           i.quantity, i.min_stock, i.max_stock,
           (i.quantity <= i.min_stock) AS is_low
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    JOIN branches b ON b.id = i.branch_id
    WHERE i.company_id = ? AND p.is_active = TRUE`;
  const params = [cid];

  if (branch_id)       { sql += ' AND i.branch_id=?'; params.push(branch_id); }
  if (low_stock==='true') sql += ' HAVING is_low = 1';
  sql += ' ORDER BY p.name';

  res.json(await query(sql, params));
});

export const adjustStock = wrap(async (req, res) => {
  const cid = req.company.id;
  const { product_id, variant_id, branch_id, quantity, reason, type = 'adjustment' } = req.body;

  await transaction(async (conn) => {
    const [[curr]] = await conn.execute(
      'SELECT quantity FROM inventory WHERE company_id=? AND branch_id=? AND product_id=?',
      [cid, branch_id, product_id]
    );
    const before = curr?.quantity || 0;
    const after  = Number(before) + Number(quantity);

    await conn.execute(
      `INSERT INTO inventory (company_id, branch_id, product_id, variant_id, quantity)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
      [cid, branch_id, product_id, variant_id||null, quantity, quantity]
    );

    await conn.execute(
      `INSERT INTO inventory_movements
       (company_id, branch_id, product_id, variant_id, user_id, type, quantity, quantity_before, quantity_after, reason)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [cid, branch_id, product_id, variant_id||null, req.user.id, type,
       quantity, before, after, reason||null]
    );

    if (after <= (curr?.min_stock || 5)) {
      req.io?.to(`company:${cid}`).emit('inventory:low', { product_id, branch_id, quantity: after });
    }
  });

  res.json({ message: 'Stock ajustado' });
});

export const getMovements = wrap(async (req, res) => {
  const cid = req.company.id;
  const { product_id, branch_id, type, from, to, limit=100 } = req.query;

  let sql = `
    SELECT m.*, p.name AS product_name, u.name AS user_name, b.name AS branch_name
    FROM inventory_movements m
    JOIN products p ON p.id = m.product_id
    JOIN users u ON u.id = m.user_id
    JOIN branches b ON b.id = m.branch_id
    WHERE m.company_id=?`;
  const params = [cid];

  if (product_id) { sql += ' AND m.product_id=?'; params.push(product_id); }
  if (branch_id)  { sql += ' AND m.branch_id=?';  params.push(branch_id); }
  if (type)       { sql += ' AND m.type=?';        params.push(type); }
  if (from)       { sql += ' AND m.created_at>=?'; params.push(from); }
  if (to)         { sql += ' AND m.created_at<=?'; params.push(to); }
  sql += ' ORDER BY m.created_at DESC LIMIT ?';
  params.push(Number(limit));

  res.json(await query(sql, params));
});

export const setStockLimits = wrap(async (req, res) => {
  const { product_id, branch_id, min_stock, max_stock } = req.body;
  await query(
    'UPDATE inventory SET min_stock=?, max_stock=? WHERE company_id=? AND product_id=? AND branch_id=?',
    [min_stock, max_stock||null, req.company.id, product_id, branch_id]
  );
  res.json({ message: 'Límites actualizados' });
});
