import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes      from './modules/auth/auth.routes.js';
import catalogRoutes   from './modules/catalog/catalog.routes.js';
import posRoutes       from './modules/pos/pos.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import usersRoutes     from './modules/users/users.routes.js';
import aiRoutes        from './modules/ai/ai.routes.js';
import statsRoutes     from './modules/stats/stats.routes.js';
import publicRoutes    from './modules/public/public.routes.js';

const app    = express();
const server = createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }
});

// ── Middlewares globales ──────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }));
app.use('/api',      rateLimit({ windowMs: 1  * 60 * 1000, max: 300 }));

// Inyectar io en requests
app.use((req, _, next) => { req.io = io; next(); });

// ── Rutas ────────────────────────────────────────────────────
app.use('/api/auth',                authRoutes);
app.use('/api/catalog',             catalogRoutes);
app.use('/api/pos',                 posRoutes);
app.use('/api/inventory',           inventoryRoutes);
app.use('/api/users',               usersRoutes);
app.use('/api/ai',                  aiRoutes);
app.use('/api/stats',               statsRoutes);
app.use('/api/public',              publicRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: new Date() }));

// ── WebSocket ────────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('join:company', (companyId) => {
    socket.join(`company:${companyId}`);
  });
  socket.on('disconnect', () => {});
});

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, _next) => {
  const status  = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  if (status === 500) console.error(err);
  res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 LiquidPOS API en http://localhost:${PORT}`));
