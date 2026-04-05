import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import authRoutes     from './routes/auth.js';
import businessRoutes from './routes/businesses.js';
import productRoutes  from './routes/products.js';
import invoiceRoutes  from './routes/invoices.js';
import miscRoutes     from './routes/misc.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3001;

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o.trim()))) cb(null, true);
    else cb(new Error(`CORS: ${origin} no permitido`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Business-Id']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── ROUTES ────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/invoices',   invoiceRoutes);
app.use('/api',            miscRoutes);   // stats, warehouses, categories, discounts, customers, catalog, notifications, transactions

// ── HEALTH ────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── 404 ───────────────────────────────────────────────────────
app.use('/api', (_, res) => res.status(404).json({ message: 'Endpoint no encontrado' }));

// ── ERROR HANDLER ─────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('❌ Unhandled error:', err.message);
  res.status(500).json({ message: err.message || 'Error interno del servidor' });
});

// ── START ─────────────────────────────────────────────────────
(async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 LiquidPOS API corriendo en http://localhost:${PORT}`);
  });
})();

export default app; // Para Vercel
