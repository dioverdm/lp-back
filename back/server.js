import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { pool, initializeDatabase } from './config/database.js';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = process.env.PORT || 3001;

// 1. CORREGIR CORS
app.use(cors({
  origin: 'https://zanda-tau.vercel.app', // ✅ Sin slash final
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// 2. SESIONES EN MEMORIA (sin MySQL Store)
app.use(session({
  name: 'liquidpos.sid',
  secret: process.env.SESSION_SECRET || 'your-session-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Cambiar a true en producción con HTTPS
    httpOnly: true,
    maxAge: 86400000, // 1 día
    sameSite: 'lax'
  },
  // Memory store por defecto (no persistente entre reinicios)
}));

// Initialize database
initializeDatabase();

// Auth middleware
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: 'Authentication required' });
  }
};

// Helper function for database errors
const handleDatabaseError = (error, res) => {
  console.error('Database error:', error);
  if (error.code === 'ER_DUP_ENTRY') {
    res.status(400).json({ message: 'Duplicate entry' });
  } else {
    res.status(500).json({ message: 'Database error' });
  }
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [email, hashedPassword, name]
    );

    // Create default location for new user
    await pool.execute(
      'INSERT INTO locations (user_id, name, description) VALUES (?, ?, ?)',
      [result.insertId, 'Default Location', 'Main storage location']
    );

    // Set session
    req.session.userId = result.insertId;
    
    const [users] = await pool.execute(
      'SELECT id, email, name, created_at as createdAt FROM users WHERE id = ?',
      [result.insertId]
    );

    res.json({ user: users[0] });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Set session
    req.session.userId = user.id;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

app.get('/api/auth/profile', requireAuth, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, email, name, created_at as createdAt FROM users WHERE id = ?',
      [req.session.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('liquidpos.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// Check auth status
app.get('/api/auth/check', (req, res) => {
  res.json({ authenticated: !!req.session.userId });
});

// Items routes
app.get('/api/items', requireAuth, async (req, res) => {
  try {
    const [items] = await pool.execute(
      `SELECT i.*, l.name as locationName 
       FROM items i 
       LEFT JOIN locations l ON i.location_id = l.id 
       WHERE i.user_id = ? 
       ORDER BY i.created_at DESC`,
      [req.session.userId]
    );

    res.json(items);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

app.post('/api/items', requireAuth, async (req, res) => {
  try {
    const { name, sku, category, locationId, quantity, minStock, description, imageUrl } = req.body;

    if (!name || !sku || !category || !locationId) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Verify location belongs to user
    const [userLocations] = await pool.execute(
      'SELECT id FROM locations WHERE id = ? AND user_id = ?',
      [locationId, req.session.userId]
    );

    if (userLocations.length === 0) {
      return res.status(400).json({ message: 'Invalid location' });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO items (user_id, name, sku, category, location_id, quantity, min_stock, description, image_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.session.userId, name, sku, category, locationId, quantity || 0, minStock || 10, description || '', imageUrl || '']
    );

    const [items] = await pool.execute(
      `SELECT i.*, l.name as locationName 
       FROM items i 
       LEFT JOIN locations l ON i.location_id = l.id 
       WHERE i.id = ?`,
      [result.insertId]
    );

    res.json(items[0]);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

app.get('/api/items/:id/transactions', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify item belongs to user
    const [userItems] = await pool.execute(
      'SELECT id FROM items WHERE id = ? AND user_id = ?',
      [id, req.session.userId]
    );

    if (userItems.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const [transactions] = await pool.execute(
      `SELECT t.*, i.name as itemName, i.sku as itemSku
       FROM transactions t
       JOIN items i ON t.item_id = i.id
       WHERE t.item_id = ? AND t.user_id = ?
       ORDER BY t.timestamp DESC`,
      [id, req.session.userId]
    );

    res.json(transactions);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

app.put('/api/items/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, category, locationId, quantity, minStock, description, imageUrl } = req.body;

    if (!name || !sku || !category || !locationId) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Verify item belongs to user
    const [userItems] = await pool.execute(
      'SELECT id FROM items WHERE id = ? AND user_id = ?',
      [id, req.session.userId]
    );

    if (userItems.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await pool.execute(
      `UPDATE items 
       SET name = ?, sku = ?, category = ?, location_id = ?, quantity = ?, min_stock = ?, description = ?, image_url = ?
       WHERE id = ? AND user_id = ?`,
      [name, sku, category, locationId, quantity, minStock, description, imageUrl, id, req.session.userId]
    );

    const [items] = await pool.execute(
      `SELECT i.*, l.name as locationName 
       FROM items i 
       LEFT JOIN locations l ON i.location_id = l.id 
       WHERE i.id = ?`,
      [id]
    );

    res.json(items[0]);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

app.delete('/api/items/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM items WHERE id = ? AND user_id = ?',
      [id, req.session.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// Locations routes
app.get('/api/locations', requireAuth, async (req, res) => {
  try {
    const [locations] = await pool.execute(
      'SELECT * FROM locations WHERE user_id = ? ORDER BY name',
      [req.session.userId]
    );

    res.json(locations);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

app.post('/api/locations', requireAuth, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Location name is required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO locations (user_id, name, description) VALUES (?, ?, ?)',
      [req.session.userId, name, description || '']
    );

    const [locations] = await pool.execute(
      'SELECT * FROM locations WHERE id = ?',
      [result.insertId]
    );

    res.json(locations[0]);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

app.put('/api/locations/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Location name is required' });
    }

    const [result] = await pool.execute(
      'UPDATE locations SET name = ?, description = ? WHERE id = ? AND user_id = ?',
      [name, description || '', id, req.session.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }

    const [locations] = await pool.execute(
      'SELECT * FROM locations WHERE id = ?',
      [id]
    );

    res.json(locations[0]);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

app.delete('/api/locations/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if location is being used by any items
    const [itemsUsingLocation] = await pool.execute(
      'SELECT id FROM items WHERE location_id = ? AND user_id = ? LIMIT 1',
      [id, req.session.userId]
    );

    if (itemsUsingLocation.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete location that is being used by items. Please reassign items first.' 
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM locations WHERE id = ? AND user_id = ?',
      [id, req.session.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// 3. ENDPOINTS COMPLETOS PARA CATEGORÍAS - CORREGIDOS
app.get('/api/categories', requireAuth, async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT DISTINCT category FROM items WHERE user_id = ? AND category IS NOT NULL AND category != "" ORDER BY category',
      [req.session.userId]
    );
    
    const categoryList = categories.map(cat => cat.category);
    res.json(categoryList);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// CORREGIR: Cambiar PUT por POST y usar nombre correcto
app.post('/api/categories/rename', requireAuth, async (req, res) => {
  try {
    const { oldName, newName } = req.body;
    
    if (!oldName || !newName) {
      return res.status(400).json({ message: 'Both old and new category names are required' });
    }

    if (oldName === newName) {
      return res.status(400).json({ message: 'New category name must be different' });
    }

    // Verificar si la nueva categoría ya existe
    const [existingCategory] = await pool.execute(
      'SELECT id FROM items WHERE user_id = ? AND category = ? LIMIT 1',
      [req.session.userId, newName]
    );

    if (existingCategory.length > 0) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    // Actualizar todos los items con la categoría antigua
    const [result] = await pool.execute(
      'UPDATE items SET category = ? WHERE category = ? AND user_id = ?',
      [newName, oldName, req.session.userId]
    );

    res.json({ 
      message: 'Category renamed successfully',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// CORREGIR: Usar DELETE con parámetro correcto
app.delete('/api/categories/:categoryName', requireAuth, async (req, res) => {
  try {
    const { categoryName } = req.params;
    
    if (!categoryName) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Verificar si la categoría está siendo usada
    const [itemsUsingCategory] = await pool.execute(
      'SELECT id FROM items WHERE user_id = ? AND category = ? LIMIT 1',
      [req.session.userId, categoryName]
    );

    if (itemsUsingCategory.length > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar la categoría porque hay productos que la usan. Primero actualiza los productos.' 
      });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// Agregar después del endpoint DELETE /api/categories/:categoryName
app.post('/api/categories', requireAuth, async (req, res) => {
  try {
    const { categoryName } = req.body;
    
    if (!categoryName || categoryName.trim() === '') {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    // Verificar si la categoría ya existe
    const [existingCategories] = await pool.execute(
      'SELECT DISTINCT category FROM items WHERE user_id = ? AND category = ?',
      [req.session.userId, categoryName.trim()]
    );
    
    if (existingCategories.length > 0) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    
    // Crear un item temporal para establecer la categoría
    // O simplemente retornar éxito ya que las categorías se crean al agregar items
    res.json({
      message: 'Category created successfully',
      category: categoryName.trim()
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// 4. ENDPOINTS FALTANTES PARA DASHBOARD
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Total items
    const [totalItems] = await pool.execute(
      'SELECT COUNT(*) as count FROM items WHERE user_id = ?',
      [userId]
    );

    // Total stock
    const [totalStock] = await pool.execute(
      'SELECT COALESCE(SUM(quantity), 0) as total FROM items WHERE user_id = ?',
      [userId]
    );

    // Low stock items
    const [lowStock] = await pool.execute(
      'SELECT COUNT(*) as count FROM items WHERE user_id = ? AND quantity <= min_stock',
      [userId]
    );

    // Today's sales and items sold
    const today = new Date().toISOString().split('T')[0];
    const [todaySales] = await pool.execute(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'OUTBOUND' THEN quantity_change ELSE 0 END), 0) as sold,
        COALESCE(SUM(CASE WHEN type = 'OUTBOUND' THEN ABS(quantity_change) * 15 ELSE 0 END), 0) as sales_value
       FROM transactions 
       WHERE user_id = ? AND DATE(timestamp) = ?`,
      [userId, today]
    );

    // Total inventory value
    const [inventoryValue] = await pool.execute(
      'SELECT COALESCE(SUM(quantity * 15), 0) as value FROM items WHERE user_id = ?',
      [userId]
    );

    // Recent transactions count
    const [recentTransactions] = await pool.execute(
      'SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
      [userId]
    );

    res.json({
      totalItems: totalItems[0].count,
      totalStock: totalStock[0].total,
      lowStockItems: lowStock[0].count,
      todayItemsSold: Math.abs(todaySales[0].sold),
      todaySales: todaySales[0].sales_value,
      totalValue: inventoryValue[0].value,
      recentActivity: recentTransactions[0].count
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

app.get('/api/dashboard/activities', requireAuth, async (req, res) => {
  try {
    const [activities] = await pool.execute(
      `SELECT t.*, i.name as itemName, i.sku as itemSku, i.image_url as itemImage
       FROM transactions t
       JOIN items i ON t.item_id = i.id
       WHERE t.user_id = ?
       ORDER BY t.timestamp DESC
       LIMIT 5`,
      [req.session.userId]
    );

    // Formatear actividades para el frontend
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      itemName: activity.itemName,
      quantity: activity.quantity_change,
      timestamp: activity.timestamp,
      amount: Math.abs(activity.quantity_change) * 15,
      itemSku: activity.itemSku,
      itemImage: activity.itemImage
    }));

    res.json(formattedActivities);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// 5. NOTIFICACIONES MEJORADAS
app.get('/api/notifications', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Notificaciones de bajo stock
    const [lowStockItems] = await pool.execute(
      `SELECT id, name, quantity, min_stock 
       FROM items 
       WHERE user_id = ? AND quantity <= min_stock AND quantity > 0
       ORDER BY quantity ASC 
       LIMIT 10`,
      [userId]
    );

    // Notificaciones de stock agotado
    const [outOfStockItems] = await pool.execute(
      `SELECT id, name 
       FROM items 
       WHERE user_id = ? AND quantity = 0
       ORDER BY name ASC 
       LIMIT 10`,
      [userId]
    );

    const notifications = [];

    // Notificaciones de bajo stock
    lowStockItems.forEach(item => {
      notifications.push({
        id: `low-stock-${item.id}`,
        type: 'warning',
        title: '⚠️ Bajo Stock',
        message: `${item.name} tiene solo ${item.quantity} unidades (mín: ${item.min_stock})`,
        timestamp: new Date().toISOString(),
        itemId: item.id,
        priority: 2
      });
    });

    // Notificaciones de stock agotado
    outOfStockItems.forEach(item => {
      notifications.push({
        id: `out-of-stock-${item.id}`,
        type: 'error',
        title: '🚨 Stock Agotado',
        message: `${item.name} se ha agotado`,
        timestamp: new Date().toISOString(),
        itemId: item.id,
        priority: 1
      });
    });

    // Notificación de bienvenida si no hay otras notificaciones
    if (notifications.length === 0) {
      notifications.push({
        id: 'welcome',
        type: 'info',
        title: '👋 Bienvenido',
        message: 'Todo está en orden. No hay notificaciones pendientes.',
        timestamp: new Date().toISOString(),
        priority: 0
      });
    }

    // Ordenar por prioridad (más alta primero)
    notifications.sort((a, b) => b.priority - a.priority);

    res.json(notifications);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

app.post('/api/notifications/:id/dismiss', requireAuth, async (req, res) => {
  try {
    res.json({ message: 'Notification dismissed' });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// 6. REPORTS ENHANCEMENT
app.get('/api/reports/summary', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const userId = req.session.userId;

    let dateCondition = '';
    const params = [userId];

    if (startDate && endDate) {
      dateCondition = 'AND DATE(t.timestamp) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    let typeCondition = '';
    if (type && type !== 'ALL') {
      typeCondition = 'AND t.type = ?';
      params.push(type);
    }

    const [summary] = await pool.execute(
      `SELECT 
        t.type,
        COUNT(*) as transaction_count,
        SUM(ABS(t.quantity_change)) as total_quantity,
        SUM(ABS(t.quantity_change) * 15) as total_value
       FROM transactions t
       WHERE t.user_id = ? ${dateCondition} ${typeCondition}
       GROUP BY t.type
       ORDER BY t.type`,
      params
    );

    // Totales generales
    const [totals] = await pool.execute(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(ABS(t.quantity_change)) as total_items,
        SUM(ABS(t.quantity_change) * 15) as total_value
       FROM transactions t
       WHERE t.user_id = ? ${dateCondition} ${typeCondition}`,
      params
    );

    res.json({
      summary,
      totals: totals[0] || { total_transactions: 0, total_items: 0, total_value: 0 }
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// Transactions routes
app.get('/api/transactions', requireAuth, async (req, res) => {
  try {
    const [transactions] = await pool.execute(
      `SELECT t.*, i.name as itemName, i.sku as itemSku
       FROM transactions t
       JOIN items i ON t.item_id = i.id
       WHERE t.user_id = ?
       ORDER BY t.timestamp DESC`,
      [req.session.userId]
    );

    res.json(transactions);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

app.post('/api/transactions', requireAuth, async (req, res) => {
  try {
    const { itemId, type, quantityChange, notes } = req.body;

    if (!itemId || !type || !quantityChange) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Verify item belongs to user
    const [userItems] = await pool.execute(
      'SELECT id, quantity FROM items WHERE id = ? AND user_id = ?',
      [itemId, req.session.userId]
    );

    if (userItems.length === 0) {
      return res.status(400).json({ message: 'Invalid item' });
    }

    const currentItem = userItems[0];

    // Check if outbound transaction would make quantity negative
    if (type === 'OUTBOUND' && currentItem.quantity < quantityChange) {
      return res.status(400).json({ 
        message: 'Insufficient stock',
        currentStock: currentItem.quantity,
        requested: quantityChange
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO transactions (user_id, item_id, type, quantity_change, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [req.session.userId, itemId, type, quantityChange, notes || '']
    );

    // Update item quantity
    if (type === 'INBOUND') {
      await pool.execute(
        'UPDATE items SET quantity = quantity + ? WHERE id = ?',
        [quantityChange, itemId]
      );
    } else if (type === 'OUTBOUND') {
      await pool.execute(
        'UPDATE items SET quantity = quantity - ? WHERE id = ?',
        [quantityChange, itemId]
      );
    }

    const [transactions] = await pool.execute(
      `SELECT t.*, i.name as itemName, i.sku as itemSku
       FROM transactions t
       JOIN items i ON t.item_id = i.id
       WHERE t.id = ?`,
      [result.insertId]
    );

    res.json(transactions[0]);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const [result] = await pool.execute('SELECT 1 as status');
    res.json({ 
      status: 'OK', 
      database: result[0].status === 1 ? 'Connected' : 'Error',
      timestamp: new Date().toISOString(),
      session: req.session.userId ? 'authenticated' : 'unauthenticated'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error', 
      database: 'Disconnected',
      error: error.message 
    });
  }
});

// 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Session store: Memory (non-persistent)`);
});