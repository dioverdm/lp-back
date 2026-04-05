import { Router } from 'express';
import { dbGet, dbAll, dbRun } from '../config/database.js';
import { requireAuth, requireBusiness, requirePerm } from '../middleware/auth.js';

const router = Router();

// GET /api/businesses  — empresas del usuario
router.get('/', requireAuth, async (req, res) => {
  try {
    const businesses = await dbAll(
      `SELECT b.*, bm.role
       FROM businesses b
       JOIN business_members bm ON bm.business_id = b.id
       WHERE bm.user_id = ? AND bm.status = 'active' AND b.active = 1
       ORDER BY b.name`,
      [req.user.id]
    );
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener empresas' });
  }
});

// POST /api/businesses  — crear empresa
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, slug, description, address, phone, email, taxId, currency, taxRate, taxLabel } = req.body;
    if (!name || !slug) return res.status(400).json({ message: 'Nombre y slug requeridos' });

    // Verificar límite del plan
    const planLimit = await dbGet('SELECT max_businesses FROM plan_limits WHERE plan = ?', [req.user.plan]);
    const userCount = await dbGet(
      `SELECT COUNT(*) as c FROM business_members WHERE user_id = ? AND role = 'owner' AND status = 'active'`,
      [req.user.id]
    );
    if (userCount.c >= planLimit.max_businesses) {
      return res.status(403).json({ message: `Tu plan ${req.user.plan} permite máximo ${planLimit.max_businesses} empresa(s). Actualiza tu plan.`, upgrade: true });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const existing  = await dbGet('SELECT id FROM businesses WHERE slug = ?', [cleanSlug]);
    if (existing) return res.status(400).json({ message: 'Ese slug ya está en uso. Elige otro.' });

    const result = await dbRun(
      `INSERT INTO businesses (owner_id, name, slug, description, address, phone, email, tax_id, currency, tax_rate, tax_label)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, cleanSlug, description || '', address || '', phone || '', email || '', taxId || '', currency || 'USD', taxRate || 0, taxLabel || 'IVA']
    );

    // Crear como owner en members
    await dbRun('INSERT INTO business_members (business_id, user_id, role) VALUES (?, ?, ?)', [result.insertId, req.user.id, 'owner']);
    // Bodega por defecto
    await dbRun('INSERT INTO warehouses (business_id, name, description) VALUES (?, ?, ?)', [result.insertId, 'Bodega Principal', 'Ubicación por defecto']);
    // Secuencia de facturas
    await dbRun('INSERT IGNORE INTO invoice_sequences (business_id, last_number) VALUES (?, 0)', [result.insertId]);

    const biz = await dbGet('SELECT b.*, bm.role FROM businesses b JOIN business_members bm ON bm.business_id = b.id WHERE b.id = ? AND bm.user_id = ?', [result.insertId, req.user.id]);
    res.status(201).json(biz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear empresa' });
  }
});

// PUT /api/businesses/:id
router.put('/:id', requireAuth, requireBusiness, requirePerm('admin'), async (req, res) => {
  try {
    const { name, description, address, phone, email, taxId, currency, taxRate, taxLabel, catalogPublic, logo } = req.body;
    await dbRun(
      `UPDATE businesses SET name=?, description=?, address=?, phone=?, email=?, tax_id=?, currency=?, tax_rate=?, tax_label=?, catalog_public=?, logo=?
       WHERE id = ?`,
      [name, description, address, phone, email, taxId, currency, taxRate, taxLabel, catalogPublic ? 1 : 0, logo || null, req.business.id]
    );
    res.json(await dbGet('SELECT * FROM businesses WHERE id = ?', [req.business.id]));
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar empresa' });
  }
});

// DELETE /api/businesses/:id  (solo owner)
router.delete('/:id', requireAuth, requireBusiness, async (req, res) => {
  try {
    if (req.memberRole !== 'owner') return res.status(403).json({ message: 'Solo el dueño puede eliminar la empresa' });
    await dbRun('UPDATE businesses SET active = 0 WHERE id = ?', [req.business.id]);
    res.json({ message: 'Empresa eliminada' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar empresa' });
  }
});

// ── MIEMBROS ──────────────────────────────────────────────────

// GET /api/businesses/:id/members
router.get('/:id/members', requireAuth, requireBusiness, requirePerm('members'), async (req, res) => {
  try {
    const members = await dbAll(
      `SELECT bm.id, bm.role, bm.status, bm.created_at, bm.permissions,
              u.id as userId, u.name, u.email, u.avatar
       FROM business_members bm
       JOIN users u ON u.id = bm.user_id
       WHERE bm.business_id = ?
       ORDER BY FIELD(bm.role,'owner','admin','moderator','atc','viewer'), u.name`,
      [req.business.id]
    );
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener miembros' });
  }
});

// POST /api/businesses/:id/members  — invitar
router.post('/:id/members', requireAuth, requireBusiness, requirePerm('members'), async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) return res.status(400).json({ message: 'Email y rol requeridos' });
    if (['owner'].includes(role)) return res.status(400).json({ message: 'No puedes asignar rol owner' });

    const planLimit = await dbGet('SELECT max_members FROM plan_limits WHERE plan = ?', [req.user.plan]);
    const count = await dbGet('SELECT COUNT(*) as c FROM business_members WHERE business_id = ? AND status = "active"', [req.business.id]);
    if (count.c >= planLimit.max_members) return res.status(403).json({ message: 'Límite de miembros alcanzado', upgrade: true });

    const invitedUser = await dbGet('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!invitedUser) return res.status(404).json({ message: 'No existe una cuenta con ese email' });

    const existing = await dbGet('SELECT id FROM business_members WHERE business_id = ? AND user_id = ?', [req.business.id, invitedUser.id]);
    if (existing) return res.status(400).json({ message: 'El usuario ya es miembro' });

    await dbRun('INSERT INTO business_members (business_id, user_id, role, invited_by) VALUES (?, ?, ?, ?)', [req.business.id, invitedUser.id, role, req.user.id]);
    res.status(201).json({ message: 'Miembro invitado exitosamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al invitar miembro' });
  }
});

// PUT /api/businesses/:id/members/:memberId
router.put('/:id/members/:memberId', requireAuth, requireBusiness, requirePerm('members'), async (req, res) => {
  try {
    const { role, status, permissions } = req.body;
    const member = await dbGet('SELECT * FROM business_members WHERE id = ? AND business_id = ?', [req.params.memberId, req.business.id]);
    if (!member) return res.status(404).json({ message: 'Miembro no encontrado' });
    if (member.role === 'owner') return res.status(400).json({ message: 'No se puede modificar al dueño' });

    await dbRun(
      'UPDATE business_members SET role = ?, status = ?, permissions = ? WHERE id = ?',
      [role || member.role, status || member.status, permissions ? JSON.stringify(permissions) : null, member.id]
    );
    res.json({ message: 'Miembro actualizado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar miembro' });
  }
});

// DELETE /api/businesses/:id/members/:memberId
router.delete('/:id/members/:memberId', requireAuth, requireBusiness, requirePerm('members'), async (req, res) => {
  try {
    const member = await dbGet('SELECT * FROM business_members WHERE id = ? AND business_id = ?', [req.params.memberId, req.business.id]);
    if (!member) return res.status(404).json({ message: 'Miembro no encontrado' });
    if (member.role === 'owner') return res.status(400).json({ message: 'No puedes eliminar al dueño' });
    await dbRun('DELETE FROM business_members WHERE id = ?', [member.id]);
    res.json({ message: 'Miembro eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar miembro' });
  }
});

export default router;
