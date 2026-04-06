import { query } from '../../config/db.js';

const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res); } catch (e) { next(e); }
};

export const getDashboard = wrap(async (req, res) => {
  const cid = req.company.id;

  const [todaySales] = await query(
    `SELECT COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue
     FROM orders WHERE company_id=? AND status='paid' AND DATE(created_at)=CURDATE()`,
    [cid]
  );
  const [monthSales] = await query(
    `SELECT COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue
     FROM orders WHERE company_id=? AND status='paid'
       AND YEAR(created_at)=YEAR(NOW()) AND MONTH(created_at)=MONTH(NOW())`,
    [cid]
  );
  const [lowStock] = await query(
    `SELECT COUNT(*) AS count FROM inventory i
     WHERE i.company_id=? AND i.quantity <= i.min_stock`,
    [cid]
  );
  const [pendingOrders] = await query(
    "SELECT COUNT(*) AS count FROM orders WHERE company_id=? AND status='pending'",
    [cid]
  );

  // Ventas por hora hoy
  const hourly = await query(
    `SELECT HOUR(created_at) AS hour, COALESCE(SUM(total),0) AS revenue, COUNT(*) AS count
     FROM orders WHERE company_id=? AND status='paid' AND DATE(created_at)=CURDATE()
     GROUP BY hour ORDER BY hour`,
    [cid]
  );

  // Ventas últimos 7 días
  const weekly = await query(
    `SELECT DATE(created_at) AS date, COALESCE(SUM(total),0) AS revenue, COUNT(*) AS orders
     FROM orders WHERE company_id=? AND status='paid'
       AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     GROUP BY DATE(created_at) ORDER BY date`,
    [cid]
  );

  // Top productos
  const topProducts = await query(
    `SELECT p.name, p.image_url, SUM(oi.quantity) AS sold, SUM(oi.subtotal) AS revenue
     FROM order_items oi
     JOIN orders o ON o.id=oi.order_id
     JOIN products p ON p.id=oi.product_id
     WHERE o.company_id=? AND o.status='paid'
       AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY oi.product_id ORDER BY sold DESC LIMIT 5`,
    [cid]
  );

  // Ventas por método de pago (mes)
  const paymentMethods = await query(
    `SELECT pm.method, COALESCE(SUM(pm.amount),0) AS total
     FROM payments pm JOIN orders o ON o.id=pm.order_id
     WHERE o.company_id=? AND o.status='paid'
       AND MONTH(o.created_at)=MONTH(NOW()) AND YEAR(o.created_at)=YEAR(NOW())
     GROUP BY pm.method`,
    [cid]
  );

  res.json({
    today:   { orders: Number(todaySales.orders), revenue: Number(todaySales.revenue) },
    month:   { orders: Number(monthSales.orders), revenue: Number(monthSales.revenue) },
    lowStock: Number(lowStock.count),
    pending:  Number(pendingOrders.count),
    hourly, weekly, topProducts, paymentMethods,
  });
});

export const getSalesReport = wrap(async (req, res) => {
  const cid = req.company.id;
  const { from, to, group_by = 'day' } = req.query;

  const groupExpr = group_by === 'month'
    ? "DATE_FORMAT(created_at, '%Y-%m')"
    : "DATE(created_at)";

  const sales = await query(
    `SELECT ${groupExpr} AS period,
            COUNT(*) AS orders,
            SUM(total) AS revenue,
            SUM(tax_amount) AS tax,
            SUM(subtotal) AS subtotal
     FROM orders WHERE company_id=? AND status='paid'
       AND created_at BETWEEN ? AND ?
     GROUP BY period ORDER BY period`,
    [cid, from || '2024-01-01', to || new Date().toISOString().slice(0,10)]
  );
  res.json(sales);
});
