import { Router } from 'express';
import { dbGet, dbAll, dbRun, pool } from '../config/database.js';
import { requireAuth, requireBusiness, requirePerm } from '../middleware/auth.js';

const router = Router();

// Generar número de factura
const nextInvoiceNumber = async (businessId) => {
  await dbRun('INSERT IGNORE INTO invoice_sequences (business_id, last_number) VALUES (?, 0)', [businessId]);
  await dbRun('UPDATE invoice_sequences SET last_number = last_number + 1 WHERE business_id = ?', [businessId]);
  const row = await dbGet('SELECT last_number FROM invoice_sequences WHERE business_id = ?', [businessId]);
  return `INV-${String(row.last_number).padStart(5, '0')}`;
};

// GET /api/invoices
router.get('/', requireAuth, requireBusiness, requirePerm('invoices'), async (req, res) => {
  try {
    const { status, search, from, to, page = 1, limit = 50 } = req.query;
    let where = 'i.business_id = ?';
    const params = [req.business.id];

    if (status && status !== 'all') { where += ' AND i.status = ?'; params.push(status); }
    if (search) { where += ' AND (i.invoice_number LIKE ? OR i.customer_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (from) { where += ' AND DATE(i.created_at) >= ?'; params.push(from); }
    if (to)   { where += ' AND DATE(i.created_at) <= ?'; params.push(to); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const invoices = await dbAll(
      `SELECT i.*, u.name as createdByName FROM invoices i LEFT JOIN users u ON u.id = i.created_by WHERE ${where} ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [{ total }] = await dbAll(`SELECT COUNT(*) as total FROM invoices i WHERE ${where}`, params);
    res.json({ invoices, total });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener facturas' });
  }
});

// GET /api/invoices/:id
router.get('/:id', requireAuth, requireBusiness, requirePerm('invoices'), async (req, res) => {
  try {
    const invoice = await dbGet(
      `SELECT i.*, u.name as createdByName, b.name as businessName, b.tax_id as businessTaxId, b.address as businessAddress, b.phone as businessPhone, b.logo as businessLogo, b.tax_label, b.currency
       FROM invoices i
       LEFT JOIN users u ON u.id = i.created_by
       LEFT JOIN businesses b ON b.id = i.business_id
       WHERE i.id = ? AND i.business_id = ?`,
      [req.params.id, req.business.id]
    );
    if (!invoice) return res.status(404).json({ message: 'Factura no encontrada' });

    const items = await dbAll(
      `SELECT ii.*, p.image_url, p.barcode FROM invoice_items ii LEFT JOIN products p ON p.id = ii.product_id WHERE ii.invoice_id = ?`,
      [invoice.id]
    );

    res.json({ ...invoice, items });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener factura' });
  }
});

// POST /api/invoices  — crear factura / ticket
router.post('/', requireAuth, requireBusiness, requirePerm('invoices'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { customerId, customerName, customerEmail, customerPhone, customerAddress, customerTaxId,
            items, paymentMethod, notes, discountGlobal = 0, status = 'paid' } = req.body;

    if (!items?.length) return res.status(400).json({ message: 'La factura debe tener al menos un producto' });

    // Verificar límite mensual
    const planLimit = await dbGet('SELECT max_invoices_month FROM plan_limits WHERE plan = ?', [req.user.plan]);
    const thisMonth = await dbGet(
      `SELECT COUNT(*) as c FROM invoices WHERE business_id = ? AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())`,
      [req.business.id]
    );
    if (thisMonth.c >= planLimit.max_invoices_month) return res.status(403).json({ message: 'Límite mensual de facturas alcanzado', upgrade: true });

    // Calcular totales
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await dbGet('SELECT * FROM products WHERE id = ? AND business_id = ? AND active = 1', [item.productId, req.business.id], conn);
      if (!product) { await conn.rollback(); return res.status(400).json({ message: `Producto ${item.productId} no encontrado` }); }
      if (product.stock < item.quantity) { await conn.rollback(); return res.status(400).json({ message: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}` }); }

      const unitPrice = item.unitPrice ?? product.price;
      const disc = item.discountPct || 0;
      const lineTotal = unitPrice * item.quantity * (1 - disc / 100);
      subtotal += lineTotal;

      processedItems.push({ ...item, productId: product.id, name: product.name, unitPrice, discountPct: disc, subtotal: lineTotal, warehouseId: product.warehouse_id });
    }

    const discountAmount = discountGlobal > 0 ? subtotal * (discountGlobal / 100) : 0;
    const taxableAmount  = subtotal - discountAmount;
    const taxAmount      = taxableAmount * (req.business.taxRate / 100);
    const total          = taxableAmount + taxAmount;

    const invoiceNumber = await nextInvoiceNumber(req.business.id);
    const [invoiceResult] = await conn.execute(
      `INSERT INTO invoices (business_id, invoice_number, customer_id, customer_name, customer_email, customer_phone, customer_address, customer_tax_id, subtotal, discount_amount, tax_amount, total, payment_method, status, notes, created_by, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.business.id, invoiceNumber, customerId || null, customerName || 'Consumidor Final', customerEmail || null, customerPhone || null, customerAddress || null, customerTaxId || null, subtotal, discountAmount, taxAmount, total, paymentMethod || 'cash', status, notes || null, req.user.id, status === 'paid' ? new Date() : null]
    );

    const invoiceId = invoiceResult.insertId;

    for (const item of processedItems) {
      await conn.execute(
        'INSERT INTO invoice_items (invoice_id, product_id, name, quantity, unit_price, discount_pct, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [invoiceId, item.productId, item.name, item.quantity, item.unitPrice, item.discountPct, item.subtotal]
      );
      // Descontar stock
      await conn.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.productId]);
      // Registrar transacción
      await conn.execute(
        'INSERT INTO transactions (business_id, product_id, warehouse_id, type, quantity, unit_price, total, invoice_id, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.business.id, item.productId, item.warehouseId, 'SALE', item.quantity, item.unitPrice, item.subtotal, invoiceId, `Venta factura ${invoiceNumber}`, req.user.id]
      );
    }

    await conn.commit();

    const invoice = await dbGet(`SELECT i.*, b.name as businessName, b.address as businessAddress, b.phone as businessPhone, b.logo as businessLogo, b.tax_label, b.currency FROM invoices i JOIN businesses b ON b.id = i.business_id WHERE i.id = ?`, [invoiceId]);
    const savedItems = await dbAll('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
    res.status(201).json({ ...invoice, items: savedItems });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Error al crear factura' });
  } finally {
    conn.release();
  }
});

// PATCH /api/invoices/:id/status
router.patch('/:id/status', requireAuth, requireBusiness, requirePerm('invoices'), async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await dbGet('SELECT * FROM invoices WHERE id = ? AND business_id = ?', [req.params.id, req.business.id]);
    if (!invoice) return res.status(404).json({ message: 'Factura no encontrada' });

    const paidAt = status === 'paid' ? new Date() : invoice.paid_at;
    await dbRun('UPDATE invoices SET status = ?, paid_at = ? WHERE id = ?', [status, paidAt, invoice.id]);

    // Si se cancela, revertir stock
    if (status === 'cancelled' && invoice.status !== 'cancelled') {
      const items = await dbAll('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoice.id]);
      for (const item of items) {
        if (item.product_id) await dbRun('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
    }

    res.json({ message: 'Estado actualizado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar factura' });
  }
});

// DELETE /api/invoices/:id  (solo draft)
router.delete('/:id', requireAuth, requireBusiness, requirePerm('invoices'), async (req, res) => {
  try {
    const invoice = await dbGet('SELECT * FROM invoices WHERE id = ? AND business_id = ?', [req.params.id, req.business.id]);
    if (!invoice) return res.status(404).json({ message: 'Factura no encontrada' });
    if (invoice.status !== 'draft') return res.status(400).json({ message: 'Solo se pueden eliminar borradores. Cancela la factura primero.' });
    await dbRun('DELETE FROM invoices WHERE id = ?', [invoice.id]);
    res.json({ message: 'Factura eliminada' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar factura' });
  }
});

export default router;
