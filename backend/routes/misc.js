import { Router } from 'express';
import { dbGet, dbAll, dbRun } from '../config/database.js';
import { requireAuth, requireBusiness, requirePerm } from '../middleware/auth.js';

const router = Router();

// ─────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────

router.get('/stats/dashboard', requireAuth, requireBusiness, async (req, res) => {
  try {
    const bid = req.business.id;

    const [totals] = await dbAll(
      `SELECT COUNT(*) as totalProducts, SUM(stock) as totalStock, SUM(stock * price) as inventoryValue, SUM(stock * cost) as inventoryCost
       FROM products WHERE business_id = ? AND active = 1`, [bid]
    );

    const lowStock   = await dbGet('SELECT COUNT(*) as c FROM products WHERE business_id = ? AND active = 1 AND stock > 0 AND stock <= min_stock', [bid]);
    const outOfStock = await dbGet('SELECT COUNT(*) as c FROM products WHERE business_id = ? AND active = 1 AND stock = 0', [bid]);

    const today = new Date().toISOString().split('T')[0];
    const todaySales = await dbGet(
      `SELECT COALESCE(SUM(total),0) as revenue, COALESCE(SUM(quantity),0) as units
       FROM transactions WHERE business_id = ? AND type = 'SALE' AND DATE(created_at) = ?`, [bid, today]
    );

    const monthSales = await dbGet(
      `SELECT COALESCE(SUM(total),0) as revenue FROM transactions WHERE business_id = ? AND type = 'SALE' AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())`, [bid]
    );

    const weekChart = await dbAll(
      `SELECT DATE(created_at) as date, COALESCE(SUM(total),0) as revenue, COALESCE(SUM(quantity),0) as units
       FROM transactions WHERE business_id = ? AND type = 'SALE' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at) ORDER BY date`, [bid]
    );

    const topProducts = await dbAll(
      `SELECT p.name, p.image_url, SUM(t.quantity) as sold, SUM(t.total) as revenue
       FROM transactions t JOIN products p ON p.id = t.product_id
       WHERE t.business_id = ? AND t.type = 'SALE' AND MONTH(t.created_at) = MONTH(NOW())
       GROUP BY t.product_id ORDER BY sold DESC LIMIT 5`, [bid]
    );

    const recentTransactions = await dbAll(
      `SELECT t.*, p.name as productName, p.image_url, u.name as createdByName
       FROM transactions t JOIN products p ON p.id = t.product_id LEFT JOIN users u ON u.id = t.created_by
       WHERE t.business_id = ? ORDER BY t.created_at DESC LIMIT 8`, [bid]
    );

    const pendingInvoices = await dbGet('SELECT COUNT(*) as c, COALESCE(SUM(total),0) as total FROM invoices WHERE business_id = ? AND status = "pending"', [bid]);

    res.json({
      products:      { total: totals.totalProducts || 0, stock: totals.totalStock || 0, inventoryValue: totals.inventoryValue || 0, inventoryCost: totals.inventoryCost || 0 },
      alerts:        { lowStock: lowStock.c, outOfStock: outOfStock.c },
      sales:         { today: todaySales.revenue, todayUnits: todaySales.units, month: monthSales.revenue },
      pending:       { count: pendingInvoices.c, total: pendingInvoices.total },
      weekChart,
      topProducts,
      recentTransactions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

router.get('/stats/reports', requireAuth, requireBusiness, requirePerm('reports'), async (req, res) => {
  try {
    const { from, to, type } = req.query;
    const bid = req.business.id;
    let where = 't.business_id = ?';
    const params = [bid];
    if (from) { where += ' AND DATE(t.created_at) >= ?'; params.push(from); }
    if (to)   { where += ' AND DATE(t.created_at) <= ?'; params.push(to); }
    if (type) { where += ' AND t.type = ?'; params.push(type); }

    const summary = await dbAll(
      `SELECT t.type, COUNT(*) as count, SUM(ABS(t.quantity)) as units, SUM(t.total) as total
       FROM transactions t WHERE ${where} GROUP BY t.type`, params
    );

    const daily = await dbAll(
      `SELECT DATE(t.created_at) as date, SUM(CASE WHEN t.type='SALE' THEN t.total ELSE 0 END) as revenue,
              SUM(CASE WHEN t.type='INBOUND' THEN t.quantity ELSE 0 END) as inbound,
              SUM(CASE WHEN t.type='OUTBOUND' OR t.type='SALE' THEN t.quantity ELSE 0 END) as outbound
       FROM transactions t WHERE ${where} GROUP BY DATE(t.created_at) ORDER BY date`, params
    );

    const byCategory = await dbAll(
      `SELECT c.name as category, COUNT(*) as transactions, SUM(t.quantity) as units, SUM(t.total) as revenue
       FROM transactions t JOIN products p ON p.id = t.product_id LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${where} GROUP BY c.id ORDER BY revenue DESC`, params
    );

    res.json({ summary, daily, byCategory });
  } catch (err) {
    res.status(500).json({ message: 'Error en reportes' });
  }
});

// ─────────────────────────────────────────────────────────────
// WAREHOUSES
// ─────────────────────────────────────────────────────────────

router.get('/warehouses', requireAuth, requireBusiness, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM warehouses WHERE business_id = ? ORDER BY name', [req.business.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error' }); }
});

router.post('/warehouses', requireAuth, requireBusiness, requirePerm('warehouses'), async (req, res) => {
  try {
    const { name, description, address } = req.body;
    if (!name) return res.status(400).json({ message: 'Nombre requerido' });
    const r = await dbRun('INSERT INTO warehouses (business_id, name, description, address) VALUES (?, ?, ?, ?)', [req.business.id, name, description || '', address || '']);
    res.status(201).json(await dbGet('SELECT * FROM warehouses WHERE id = ?', [r.insertId]));
  } catch (err) { res.status(500).json({ message: 'Error al crear bodega' }); }
});

router.put('/warehouses/:id', requireAuth, requireBusiness, requirePerm('warehouses'), async (req, res) => {
  try {
    const { name, description, address, active } = req.body;
    await dbRun('UPDATE warehouses SET name=?, description=?, address=?, active=? WHERE id=? AND business_id=?', [name, description, address, active ? 1 : 0, req.params.id, req.business.id]);
    res.json(await dbGet('SELECT * FROM warehouses WHERE id = ?', [req.params.id]));
  } catch (err) { res.status(500).json({ message: 'Error al actualizar bodega' }); }
});

router.delete('/warehouses/:id', requireAuth, requireBusiness, requirePerm('warehouses'), async (req, res) => {
  try {
    const inUse = await dbGet('SELECT id FROM products WHERE warehouse_id = ? AND business_id = ? AND active = 1 LIMIT 1', [req.params.id, req.business.id]);
    if (inUse) return res.status(400).json({ message: 'La bodega tiene productos asignados. Reasígnalos primero.' });
    await dbRun('DELETE FROM warehouses WHERE id = ? AND business_id = ?', [req.params.id, req.business.id]);
    res.json({ message: 'Bodega eliminada' });
  } catch (err) { res.status(500).json({ message: 'Error al eliminar bodega' }); }
});

// ─────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────

router.get('/categories', requireAuth, requireBusiness, async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT c.*, COUNT(p.id) as productCount FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.active = 1 WHERE c.business_id = ? GROUP BY c.id ORDER BY c.name`,
      [req.business.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error' }); }
});

router.post('/categories', requireAuth, requireBusiness, requirePerm('categories'), async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    if (!name) return res.status(400).json({ message: 'Nombre requerido' });
    const r = await dbRun('INSERT INTO categories (business_id, name, color, icon) VALUES (?, ?, ?, ?)', [req.business.id, name, color || '#6B00FF', icon || null]);
    res.status(201).json(await dbGet('SELECT * FROM categories WHERE id = ?', [r.insertId]));
  } catch (err) { res.status(500).json({ message: 'Error al crear categoría' }); }
});

router.put('/categories/:id', requireAuth, requireBusiness, requirePerm('categories'), async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    await dbRun('UPDATE categories SET name=?, color=?, icon=? WHERE id=? AND business_id=?', [name, color, icon, req.params.id, req.business.id]);
    res.json(await dbGet('SELECT * FROM categories WHERE id = ?', [req.params.id]));
  } catch (err) { res.status(500).json({ message: 'Error' }); }
});

router.delete('/categories/:id', requireAuth, requireBusiness, requirePerm('categories'), async (req, res) => {
  try {
    await dbRun('UPDATE products SET category_id = NULL WHERE category_id = ? AND business_id = ?', [req.params.id, req.business.id]);
    await dbRun('DELETE FROM categories WHERE id = ? AND business_id = ?', [req.params.id, req.business.id]);
    res.json({ message: 'Categoría eliminada' });
  } catch (err) { res.status(500).json({ message: 'Error' }); }
});

// ─────────────────────────────────────────────────────────────
// DISCOUNTS
// ─────────────────────────────────────────────────────────────

router.get('/discounts', requireAuth, requireBusiness, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM discounts WHERE business_id = ? ORDER BY name', [req.business.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error' }); }
});

router.post('/discounts', requireAuth, requireBusiness, requirePerm('discounts'), async (req, res) => {
  try {
    const { name, code, type, value, minPurchase, active, startsAt, endsAt, usageLimit } = req.body;
    if (!name || !value) return res.status(400).json({ message: 'Nombre y valor requeridos' });
    const planLimit = await dbGet('SELECT discounts_enabled FROM plan_limits WHERE plan = ?', [req.user.plan]);
    if (!planLimit.discounts_enabled) return res.status(403).json({ message: 'Los descuentos requieren plan Starter o superior', upgrade: true });
    const r = await dbRun(
      'INSERT INTO discounts (business_id, name, code, type, value, min_purchase, active, starts_at, ends_at, usage_limit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.business.id, name, code || null, type || 'percentage', value, minPurchase || 0, active ? 1 : 0, startsAt || null, endsAt || null, usageLimit || null]
    );
    res.status(201).json(await dbGet('SELECT * FROM discounts WHERE id = ?', [r.insertId]));
  } catch (err) { res.status(500).json({ message: 'Error al crear descuento' }); }
});

router.put('/discounts/:id', requireAuth, requireBusiness, requirePerm('discounts'), async (req, res) => {
  try {
    const { name, code, type, value, minPurchase, active, startsAt, endsAt } = req.body;
    await dbRun('UPDATE discounts SET name=?, code=?, type=?, value=?, min_purchase=?, active=?, starts_at=?, ends_at=? WHERE id=? AND business_id=?',
      [name, code, type, value, minPurchase, active ? 1 : 0, startsAt, endsAt, req.params.id, req.business.id]);
    res.json(await dbGet('SELECT * FROM discounts WHERE id = ?', [req.params.id]));
  } catch (err) { res.status(500).json({ message: 'Error' }); }
});

router.delete('/discounts/:id', requireAuth, requireBusiness, requirePerm('discounts'), async (req, res) => {
  try {
    await dbRun('UPDATE products SET discount_id = NULL WHERE discount_id = ? AND business_id = ?', [req.params.id, req.business.id]);
    await dbRun('DELETE FROM discounts WHERE id = ? AND business_id = ?', [req.params.id, req.business.id]);
    res.json({ message: 'Descuento eliminado' });
  } catch (err) { res.status(500).json({ message: 'Error' }); }
});

// ─────────────────────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────────────────────

router.get('/customers', requireAuth, requireBusiness, requirePerm('customers'), async (req, res) => {
  try {
    const { search } = req.query;
    let where = 'business_id = ?';
    const params = [req.business.id];
    if (search) { where += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    res.json(await dbAll(`SELECT * FROM customers WHERE ${where} ORDER BY name`, params));
  } catch (err) { res.status(500).json({ message: 'Error' }); }
});

router.post('/customers', requireAuth, requireBusiness, requirePerm('customers'), async (req, res) => {
  try {
    const { name, email, phone, address, taxId, notes } = req.body;
    if (!name) return res.status(400).json({ message: 'Nombre requerido' });
    const r = await dbRun('INSERT INTO customers (business_id, name, email, phone, address, tax_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)', [req.business.id, name, email || null, phone || null, address || null, taxId || null, notes || null]);
    res.status(201).json(await dbGet('SELECT * FROM customers WHERE id = ?', [r.insertId]));
  } catch (err) { res.status(500).json({ message: 'Error al crear cliente' }); }
});

router.put('/customers/:id', requireAuth, requireBusiness, requirePerm('customers'), async (req, res) => {
  try {
    const { name, email, phone, address, taxId, notes } = req.body;
    await dbRun('UPDATE customers SET name=?, email=?, phone=?, address=?, tax_id=?, notes=? WHERE id=? AND business_id=?', [name, email, phone, address, taxId, notes, req.params.id, req.business.id]);
    res.json(await dbGet('SELECT * FROM customers WHERE id = ?', [req.params.id]));
  } catch (err) { res.status(500).json({ message: 'Error' }); }
});

router.delete('/customers/:id', requireAuth, requireBusiness, requirePerm('customers'), async (req, res) => {
  try {
    await dbRun('DELETE FROM customers WHERE id = ? AND business_id = ?', [req.params.id, req.business.id]);
    res.json({ message: 'Cliente eliminado' });
  } catch (err) { res.status(500).json({ message: 'Error' }); }
});

// ─────────────────────────────────────────────────────────────
// CATALOG PÚBLICO  — NO requiere auth
// ─────────────────────────────────────────────────────────────

router.get('/catalog/:slug', async (req, res) => {
  try {
    const business = await dbGet('SELECT id, name, slug, description, logo, address, phone, email, website, currency FROM businesses WHERE slug = ? AND active = 1 AND catalog_public = 1', [req.params.slug]);
    if (!business) return res.status(404).json({ message: 'Tienda no encontrada' });

    const { category, search, featured } = req.query;
    let where = 'p.business_id = ? AND p.active = 1 AND p.catalog_visible = 1 AND p.stock > 0';
    const params = [business.id];
    if (category) { where += ' AND p.category_id = ?'; params.push(category); }
    if (search) { where += ' AND p.name LIKE ?'; params.push(`%${search}%`); }
    if (featured === 'true') where += ' AND p.featured = 1';

    const products = await dbAll(
      `SELECT p.id, p.name, p.description, p.image_url, p.price, p.unit, p.featured, p.stock,
              c.name as categoryName, c.color as categoryColor,
              d.type as discountType, d.value as discountValue, d.active as discountActive
       FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN discounts d ON d.id = p.discount_id
       WHERE ${where} ORDER BY p.featured DESC, p.name`, params
    );

    const categories = await dbAll('SELECT * FROM categories WHERE business_id = ? ORDER BY name', [business.id]);

    res.json({ business, products, categories });
  } catch (err) {
    res.status(500).json({ message: 'Error al cargar catálogo' });
  }
});

// NOTIFICATIONS
router.get('/notifications', requireAuth, requireBusiness, async (req, res) => {
  try {
    const bid = req.business.id;
    const low    = await dbAll('SELECT id, name, stock, min_stock FROM products WHERE business_id = ? AND active = 1 AND stock > 0 AND stock <= min_stock ORDER BY stock LIMIT 10', [bid]);
    const nostock = await dbAll('SELECT id, name FROM products WHERE business_id = ? AND active = 1 AND stock = 0 LIMIT 10', [bid]);
    const pending = await dbGet('SELECT COUNT(*) as c FROM invoices WHERE business_id = ? AND status = "pending"', [bid]);

    const notifs = [];
    nostock.forEach(p => notifs.push({ id: `oos-${p.id}`, type: 'error', title: '🚨 Sin Stock', message: `"${p.name}" agotado`, productId: p.id, priority: 3 }));
    low.forEach(p => notifs.push({ id: `low-${p.id}`, type: 'warning', title: '⚠️ Bajo Stock', message: `"${p.name}": ${p.stock} unidades (mín ${p.min_stock})`, productId: p.id, priority: 2 }));
    if (pending.c > 0) notifs.push({ id: 'pending-inv', type: 'info', title: '📄 Facturas Pendientes', message: `${pending.c} factura(s) por cobrar`, priority: 1 });
    if (!notifs.length) notifs.push({ id: 'ok', type: 'success', title: '✅ Todo en orden', message: 'Sin alertas activas', priority: 0 });

    res.json(notifs.sort((a, b) => b.priority - a.priority));
  } catch (err) { res.status(500).json({ message: 'Error' }); }
});

// TRANSACTIONS (global)
router.get('/transactions', requireAuth, requireBusiness, async (req, res) => {
  try {
    const { type, from, to, page = 1, limit = 50 } = req.query;
    let where = 't.business_id = ?';
    const params = [req.business.id];
    if (type) { where += ' AND t.type = ?'; params.push(type); }
    if (from) { where += ' AND DATE(t.created_at) >= ?'; params.push(from); }
    if (to)   { where += ' AND DATE(t.created_at) <= ?'; params.push(to); }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const rows = await dbAll(
      `SELECT t.*, p.name as productName, p.image_url, u.name as createdByName FROM transactions t JOIN products p ON p.id = t.product_id LEFT JOIN users u ON u.id = t.created_by WHERE ${where} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: 'Error' }); }
});

export default router;
