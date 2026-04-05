import { Router } from 'express';
import { dbGet, dbAll, dbRun } from '../config/database.js';
import { requireAuth, requireBusiness, requirePerm } from '../middleware/auth.js';

const router = Router();

// GET /api/products
router.get('/', requireAuth, requireBusiness, async (req, res) => {
  try {
    const { search, category, warehouse, lowStock, page = 1, limit = 100 } = req.query;
    let where = 'p.business_id = ? AND p.active = 1';
    const params = [req.business.id];

    if (search) { where += ' AND (p.name LIKE ? OR p.barcode LIKE ? OR p.sku LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (category) { where += ' AND p.category_id = ?'; params.push(category); }
    if (warehouse) { where += ' AND p.warehouse_id = ?'; params.push(warehouse); }
    if (lowStock === 'true') where += ' AND p.stock <= p.min_stock';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const products = await dbAll(
      `SELECT p.*, c.name as categoryName, c.color as categoryColor,
              w.name as warehouseName, d.name as discountName, d.type as discountType, d.value as discountValue, d.active as discountActive
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN warehouses w ON w.id = p.warehouse_id
       LEFT JOIN discounts d ON d.id = p.discount_id
       WHERE ${where}
       ORDER BY p.name
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [{ total }] = await dbAll(`SELECT COUNT(*) as total FROM products p WHERE ${where}`, params);
    res.json({ products, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener productos' });
  }
});

// GET /api/products/barcode/:code  — buscar por código de barras
router.get('/barcode/:code', requireAuth, requireBusiness, async (req, res) => {
  try {
    const product = await dbGet(
      `SELECT p.*, c.name as categoryName, d.value as discountValue, d.type as discountType, d.active as discountActive
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN discounts d ON d.id = p.discount_id
       WHERE (p.barcode = ? OR p.sku = ?) AND p.business_id = ? AND p.active = 1`,
      [req.params.code, req.params.code, req.business.id]
    );
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Error al buscar producto' });
  }
});

// GET /api/products/:id
router.get('/:id', requireAuth, requireBusiness, async (req, res) => {
  try {
    const product = await dbGet(
      `SELECT p.*, c.name as categoryName, c.color as categoryColor, w.name as warehouseName,
              d.name as discountName, d.type as discountType, d.value as discountValue, d.active as discountActive
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN warehouses w ON w.id = p.warehouse_id
       LEFT JOIN discounts d ON d.id = p.discount_id
       WHERE p.id = ? AND p.business_id = ?`,
      [req.params.id, req.business.id]
    );
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener producto' });
  }
});

// POST /api/products
router.post('/', requireAuth, requireBusiness, requirePerm('products'), async (req, res) => {
  try {
    // Verificar límite del plan
    const planLimit = await dbGet('SELECT max_products FROM plan_limits WHERE plan = ?', [req.user.plan]);
    const count = await dbGet('SELECT COUNT(*) as c FROM products WHERE business_id = ? AND active = 1', [req.business.id]);
    if (count.c >= planLimit.max_products) return res.status(403).json({ message: `Límite de ${planLimit.max_products} productos alcanzado`, upgrade: true });

    const { name, barcode, sku, categoryId, warehouseId, description, imageUrl, price, cost, unit, stock, minStock, discountId, featured, catalogVisible } = req.body;
    if (!name) return res.status(400).json({ message: 'El nombre es requerido' });

    if (barcode) {
      const dup = await dbGet('SELECT id FROM products WHERE barcode = ? AND business_id = ? AND active = 1', [barcode, req.business.id]);
      if (dup) return res.status(400).json({ message: 'Ya existe un producto con ese código de barras' });
    }

    const result = await dbRun(
      `INSERT INTO products (business_id, name, barcode, sku, category_id, warehouse_id, description, image_url, price, cost, unit, stock, min_stock, discount_id, featured, catalog_visible, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.business.id, name, barcode || null, sku || null, categoryId || null, warehouseId || null, description || '', imageUrl || null, price || 0, cost || 0, unit || 'unidad', stock || 0, minStock || 5, discountId || null, featured ? 1 : 0, catalogVisible !== false ? 1 : 0, req.user.id]
    );

    // Registrar entrada inicial si stock > 0
    if (stock > 0) {
      await dbRun(
        'INSERT INTO transactions (business_id, product_id, warehouse_id, type, quantity, unit_price, total, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.business.id, result.insertId, warehouseId || null, 'INBOUND', stock, cost || 0, (stock) * (cost || 0), 'Stock inicial', req.user.id]
      );
    }

    const product = await dbGet(
      `SELECT p.*, c.name as categoryName, w.name as warehouseName FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN warehouses w ON w.id = p.warehouse_id WHERE p.id = ?`,
      [result.insertId]
    );
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear producto' });
  }
});

// PUT /api/products/:id
router.put('/:id', requireAuth, requireBusiness, requirePerm('products'), async (req, res) => {
  try {
    const existing = await dbGet('SELECT * FROM products WHERE id = ? AND business_id = ?', [req.params.id, req.business.id]);
    if (!existing) return res.status(404).json({ message: 'Producto no encontrado' });

    const { name, barcode, sku, categoryId, warehouseId, description, imageUrl, price, cost, unit, minStock, discountId, featured, catalogVisible } = req.body;

    if (barcode && barcode !== existing.barcode) {
      const dup = await dbGet('SELECT id FROM products WHERE barcode = ? AND business_id = ? AND id != ? AND active = 1', [barcode, req.business.id, req.params.id]);
      if (dup) return res.status(400).json({ message: 'Ya existe otro producto con ese código de barras' });
    }

    await dbRun(
      `UPDATE products SET name=?, barcode=?, sku=?, category_id=?, warehouse_id=?, description=?, image_url=?, price=?, cost=?, unit=?, min_stock=?, discount_id=?, featured=?, catalog_visible=?
       WHERE id = ? AND business_id = ?`,
      [name || existing.name, barcode || null, sku || null, categoryId || null, warehouseId || null, description ?? existing.description, imageUrl ?? existing.image_url, price ?? existing.price, cost ?? existing.cost, unit || existing.unit, minStock ?? existing.min_stock, discountId || null, featured ? 1 : 0, catalogVisible !== false ? 1 : 0, req.params.id, req.business.id]
    );

    res.json(await dbGet(`SELECT p.*, c.name as categoryName, w.name as warehouseName FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN warehouses w ON w.id = p.warehouse_id WHERE p.id = ?`, [req.params.id]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
});

// PATCH /api/products/:id/stock  — ajuste rápido de stock
router.patch('/:id/stock', requireAuth, requireBusiness, requirePerm('inventory'), async (req, res) => {
  try {
    const { type, quantity, notes } = req.body;
    if (!type || !quantity) return res.status(400).json({ message: 'Tipo y cantidad requeridos' });

    const product = await dbGet('SELECT * FROM products WHERE id = ? AND business_id = ?', [req.params.id, req.business.id]);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    let newStock = product.stock;
    if (type === 'INBOUND')     newStock += parseInt(quantity);
    else if (type === 'OUTBOUND') {
      if (product.stock < quantity) return res.status(400).json({ message: 'Stock insuficiente', current: product.stock });
      newStock -= parseInt(quantity);
    } else if (type === 'ADJUSTMENT') newStock = parseInt(quantity);

    await dbRun('UPDATE products SET stock = ? WHERE id = ?', [newStock, product.id]);
    await dbRun(
      'INSERT INTO transactions (business_id, product_id, warehouse_id, type, quantity, unit_price, total, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.business.id, product.id, product.warehouse_id, type, Math.abs(type === 'ADJUSTMENT' ? quantity - product.stock : quantity), product.cost || product.price, 0, notes || '', req.user.id]
    );

    res.json({ ...product, stock: newStock });
  } catch (err) {
    res.status(500).json({ message: 'Error al ajustar stock' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', requireAuth, requireBusiness, requirePerm('products'), async (req, res) => {
  try {
    const result = await dbRun('UPDATE products SET active = 0 WHERE id = ? AND business_id = ?', [req.params.id, req.business.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
});

// GET /api/products/:id/transactions
router.get('/:id/transactions', requireAuth, requireBusiness, async (req, res) => {
  try {
    const txns = await dbAll(
      `SELECT t.*, u.name as createdByName FROM transactions t LEFT JOIN users u ON u.id = t.created_by
       WHERE t.product_id = ? AND t.business_id = ? ORDER BY t.created_at DESC LIMIT 50`,
      [req.params.id, req.business.id]
    );
    res.json(txns);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener transacciones' });
  }
});

export default router;
