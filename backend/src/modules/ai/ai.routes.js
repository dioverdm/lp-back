import { Router } from 'express';
import { authenticate, withCompany, can } from '../../middlewares/auth.js';
import { query } from '../../config/db.js';

const router = Router();
router.use(authenticate, withCompany);

const wrap = (fn) => async (req, res, next) => {
  try { await fn(req, res); } catch(e) { next(e); }
};

router.get('/predict-demand', can('reports.read'), wrap(async (req, res) => {
  const { product_id, days_ahead = 7 } = req.query;
  const cid = req.company.id;

  const sales = await query(
    `SELECT DATE(o.created_at) AS date, SUM(oi.quantity) AS qty
     FROM order_items oi JOIN orders o ON o.id=oi.order_id
     WHERE o.company_id=? AND oi.product_id=? AND o.status='paid'
       AND o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
     GROUP BY DATE(o.created_at) ORDER BY date ASC`,
    [cid, product_id]
  );

  if (sales.length < 5) {
    return res.json({ prediction: null, message: 'Datos insuficientes' });
  }

  // Regresión lineal simple
  const n  = sales.length;
  const xs = sales.map((_,i)=>i), ys = sales.map(s=>Number(s.qty));
  const xm = xs.reduce((a,b)=>a+b,0)/n, ym = ys.reduce((a,b)=>a+b,0)/n;
  let num=0, den=0;
  for(let i=0;i<n;i++){num+=(xs[i]-xm)*(ys[i]-ym);den+=(xs[i]-xm)**2;}
  const m = den?num/den:0, b = ym-m*xm;

  const predictions = Array.from({length:Number(days_ahead)},(_,i)=>{
    const x=n+i; const d=new Date(); d.setDate(d.getDate()+i+1);
    return { date: d.toISOString().slice(0,10), predicted_qty: Math.max(0,Math.round(m*x+b)) };
  });

  res.json({ predictions, avg_daily: Math.round(ym*10)/10 });
}));

router.get('/suggest-price', can('products.read'), wrap(async (req, res) => {
  const { product_id } = req.query;
  const [p] = await query('SELECT price, cost FROM products WHERE id=? AND company_id=?',
    [product_id, req.company.id]);
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });

  const [sales] = await query(
    `SELECT SUM(oi.quantity) AS qty FROM order_items oi JOIN orders o ON o.id=oi.order_id
     WHERE o.company_id=? AND oi.product_id=? AND o.status='paid'
       AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
    [req.company.id, product_id]
  );
  const daily = (Number(sales?.qty)||0)/30;
  const suggestion = daily>10
    ? { price: +(p.price*1.05).toFixed(2), reason:'Alta demanda: +5%' }
    : daily<2
    ? { price: +(p.price*0.95).toFixed(2), reason:'Baja rotación: -5%' }
    : { price: p.price, reason:'Precio óptimo' };

  res.json({ current: p.price, cost: p.cost, daily_avg: Math.round(daily*10)/10, ...suggestion });
}));

router.get('/basket', can('products.read'), wrap(async (req, res) => {
  const { product_id, limit=5 } = req.query;
  const related = await query(
    `SELECT oi2.product_id, p.name, p.price, p.image_url, COUNT(*) AS freq
     FROM order_items oi1
     JOIN order_items oi2 ON oi2.order_id=oi1.order_id AND oi2.product_id!=oi1.product_id
     JOIN products p ON p.id=oi2.product_id AND p.company_id=?
     JOIN orders o ON o.id=oi1.order_id
     WHERE oi1.product_id=? AND o.company_id=? AND o.status='paid'
     GROUP BY oi2.product_id ORDER BY freq DESC LIMIT ?`,
    [req.company.id, product_id, req.company.id, Number(limit)]
  );
  res.json(related);
}));

export default router;
