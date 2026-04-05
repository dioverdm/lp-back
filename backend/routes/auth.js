import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { dbGet, dbRun } from '../config/database.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Todos los campos son requeridos' });
    if (password.length < 6) return res.status(400).json({ message: 'La contraseña debe tener mínimo 6 caracteres' });

    const existing = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(400).json({ message: 'El email ya está registrado' });

    const hash = await bcrypt.hash(password, 10);
    const result = await dbRun('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name.trim(), email.toLowerCase(), hash]);

    const userId = result.insertId;
    const token  = signToken(userId);
    const user   = await dbGet('SELECT id, name, email, avatar, plan FROM users WHERE id = ?', [userId]);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email y contraseña requeridos' });

    const user = await dbGet('SELECT * FROM users WHERE email = ? AND active = 1', [email.toLowerCase()]);
    if (!user) return res.status(400).json({ message: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Credenciales inválidas' });

    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, plan: user.plan } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

// GET /api/auth/profile
router.get('/profile', requireAuth, async (req, res) => {
  res.json(req.user);
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    await dbRun('UPDATE users SET name = ?, avatar = ? WHERE id = ?', [name || req.user.name, avatar || req.user.avatar, req.user.id]);
    const updated = await dbGet('SELECT id, name, email, avatar, plan FROM users WHERE id = ?', [req.user.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
});

// PUT /api/auth/password
router.put('/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await dbGet('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const ok   = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ message: 'Contraseña actual incorrecta' });
    const hash = await bcrypt.hash(newPassword, 10);
    await dbRun('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ message: 'Error al cambiar contraseña' });
  }
});

export default router;
