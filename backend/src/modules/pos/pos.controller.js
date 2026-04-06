import { query, transaction } from '../../config/db.js';

const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res); } catch (e) { next(e); }
};

const genOrderNumber = async (cid) => {
  const d    = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const [r]  = await query(
    "SELECT COUNT(*) AS cnt FROM orders WHERE company_id=? AND DATE(created_at)=CURDATE()", [cid]
  );
  return `ORD-${d}-${String(Number(r.cnt)+1).padStart(4,'0')}`;
};

export const createOrder = wrap(async (req, res) => {
  const cid = req.company.id;
  const uid = req.user.id;
  const { branch_id, items, customer_name, customer_phone, customer_email,
    notes, payments = [], source = 'pos' } = req.body;

  if (!items?.length) return res.status(400).json({ error: 'Items requeridos' });

  const result = await transaction(async (conn) => {
    const orderNumber = await genOrderNumber(cid);
    const taxRate     = req.company.tax_rate || 0;

    let subtotal = 0, taxAmount = 0;
    for (const item of items) {
      const line  = item.quantity * item.unit_price;
      subtotal   += line;
      const rate  = item.tax_rate ?? taxRate;
      taxAmount  += line * (rate / 100);
    }
    const total = subtotal + taxAmount;

    const [orderRes] = await conn.execute(
      `INSERT INTO orders (company_id, branch_id, user_id, order_number, source,
       customer_name, customer_phone, customer_email, notes,
       subtotal, tax_amount, total, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'pending')`,
      [cid, branch_id, uid, orderNumber, source,
       customer_name||null, customer_phone||null, customer_email||null, notes||null,
       subtotal, taxAmount, total]
    );
    const orderId = orderRes.insertId;

    for (const item of items) {
      const line = item.quantity * item.unit_price;
      await conn.execute(
        `INSERT INTO order_items (order_id, product_id, variant_id, name, sku, quantity, unit_price, subtotal, tax_rate)
         SELECT ?,p.id,?,p.name,p.sku,?,?,?,? FROM products p WHERE p.id=? AND p.company_id=?`,
        [orderId, item.variant_id||null, item.quantity, item.unit_price,
         line, item.tax_rate ?? taxRate, item.product_id, cid]
      );
      await conn.execute(
        `UPDATE inventory SET quantity = quantity - ?
         WHERE company_id=? AND branch_id=? AND product_id=?`,
        [item.quantity, cid, branch_id, item.product_id]
      );
    }

    if (payments.length) {
      for (const p of payments) {
        await conn.execute(
          'INSERT INTO payments (order_id, company_id, method, amount, reference) VALUES (?,?,?,?,?)',
          [orderId, cid, p.method, p.amount, p.reference||null]
        );
      }
      await conn.execute(
        "UPDATE orders SET status='paid', paid_at=NOW(), cashier_id=? WHERE id=?",
        [uid, orderId]
      );
    }

    return { orderId, orderNumber, subtotal, taxAmount, total, status: payments.length ? 'paid':'pending' };
  });

  req.io?.to(`company:${cid}`).emit('order:new', result);
  res.status(201).json(result);
});

export const listOrders = wrap(async (req, res) => {
  const cid = req.company.id;
  const { page=1, limit=30, status, from, to, branch_id } = req.query;
  const offset = (Number(page)-1)*Number(limit);

  let sql = `SELECT o.*, u.name AS cashier_name
             FROM orders o LEFT JOIN users u ON u.id = o.cashier_id
             WHERE o.company_id=?`;
  const params = [cid];

  if (status)    { sql += ' AND o.status=?';         params.push(status); }
  if (branch_id) { sql += ' AND o.branch_id=?';      params.push(branch_id); }
  if (from)      { sql += ' AND o.created_at >= ?';  params.push(from); }
  if (to)        { sql += ' AND o.created_at <= ?';  params.push(to); }

  sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  const orders = await query(sql, params);
  const [{ total }] = await query('SELECT COUNT(*) AS total FROM orders WHERE company_id=?', [cid]);
  res.json({ orders, total: Number(total) });
});

export const getOrder = wrap(async (req, res) => {
  const cid = req.company.id;
  const [order] = await query(
    'SELECT o.*, u.name AS user_name FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=? AND o.company_id=?',
    [req.params.id, cid]
  );
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

  const items    = await query('SELECT * FROM order_items WHERE order_id=?', [order.id]);
  const payments = await query('SELECT * FROM payments WHERE order_id=?', [order.id]);
  res.json({ ...order, items, payments });
});

export const payOrder = wrap(async (req, res) => {
  const cid = req.company.id;
  const { payments } = req.body;

  const [order] = await query('SELECT * FROM orders WHERE id=? AND company_id=?',
    [req.params.id, cid]);
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
  if (order.status === 'paid') return res.status(400).json({ error: 'Ya está pagado' });

  for (const p of payments) {
    await query(
      'INSERT INTO payments (order_id, company_id, method, amount, reference) VALUES (?,?,?,?,?)',
      [order.id, cid, p.method, p.amount, p.reference||null]
    );
  }
  await query("UPDATE orders SET status='paid', paid_at=NOW(), cashier_id=? WHERE id=?",
    [req.user.id, order.id]);

  res.json({ message: 'Pago registrado' });
});

export const cancelOrder = wrap(async (req, res) => {
  const cid = req.company.id;
  await query("UPDATE orders SET status='cancelled' WHERE id=? AND company_id=?",
    [req.params.id, cid]);
  res.json({ message: 'Pedido cancelado' });
});

// Sesiones de caja
export const openCashSession = wrap(async (req, res) => {
  const { branch_id, opening_cash } = req.body;
  const [open] = await query(
    "SELECT id FROM cash_sessions WHERE company_id=? AND branch_id=? AND status='open'",
    [req.company.id, branch_id]
  );
  if (open) return res.status(400).json({ error: 'Ya hay una caja abierta' });

  const result = await query(
    "INSERT INTO cash_sessions (company_id, branch_id, cashier_id, opening_cash) VALUES (?,?,?,?)",
    [req.company.id, branch_id, req.user.id, opening_cash || 0]
  );
  res.status(201).json({ id: result.insertId });
});

export const closeCashSession = wrap(async (req, res) => {
  const { closing_cash, notes } = req.body;
  await query(
    "UPDATE cash_sessions SET status='closed', closing_cash=?, closed_at=NOW(), notes=? WHERE id=? AND company_id=?",
    [closing_cash, notes||null, req.params.id, req.company.id]
  );
  res.json({ message: 'Caja cerrada' });
});
