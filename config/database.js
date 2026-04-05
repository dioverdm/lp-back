import mysql from 'mysql2/promise';
import { EventEmitter } from 'events';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'liquidpos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Custom session store that extends EventEmitter
class MySQLSessionStore extends EventEmitter {
  constructor() {
    super();
    this.pool = pool;
  }

  async get(sid, callback) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT data FROM sessions WHERE session_id = ? AND expires > ?',
        [sid, Date.now()]
      );
      
      if (rows.length > 0) {
        callback(null, JSON.parse(rows[0].data));
      } else {
        callback(null, null);
      }
    } catch (error) {
      callback(error);
    }
  }

  async set(sid, session, callback) {
    try {
      const expires = Date.now() + (session.cookie?.maxAge || 86400000);
      const data = JSON.stringify(session);
      
      await this.pool.execute(
        'INSERT INTO sessions (session_id, expires, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE expires = ?, data = ?',
        [sid, expires, data, expires, data]
      );
      
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  async destroy(sid, callback) {
    try {
      await this.pool.execute('DELETE FROM sessions WHERE session_id = ?', [sid]);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  async touch(sid, session, callback) {
    try {
      const expires = Date.now() + (session.cookie?.maxAge || 86400000);
      await this.pool.execute(
        'UPDATE sessions SET expires = ? WHERE session_id = ?',
        [expires, sid]
      );
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  async length(callback) {
    try {
      const [rows] = await this.pool.execute('SELECT COUNT(*) as count FROM sessions');
      callback(null, rows[0].count);
    } catch (error) {
      callback(error);
    }
  }

  async clear(callback) {
    try {
      await this.pool.execute('DELETE FROM sessions');
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  async all(callback) {
    try {
      const [rows] = await this.pool.execute('SELECT session_id, data FROM sessions WHERE expires > ?', [Date.now()]);
      const sessions = rows.map(row => ({
        id: row.session_id,
        data: JSON.parse(row.data)
      }));
      callback(null, sessions);
    } catch (error) {
      callback(error);
    }
  }
}

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create locations table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create items table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(100) NOT NULL,
        location_id INT NOT NULL,
        quantity INT DEFAULT 0,
        min_stock INT DEFAULT 10,
        description TEXT,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_location_id (location_id),
        INDEX idx_sku (sku),
        INDEX idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create transactions table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        item_id INT NOT NULL,
        type ENUM('INBOUND', 'OUTBOUND', 'ADJUSTMENT') NOT NULL,
        quantity_change INT NOT NULL,
        notes TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_item_id (item_id),
        INDEX idx_timestamp (timestamp),
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create sessions table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id VARCHAR(128) NOT NULL PRIMARY KEY,
        expires BIGINT NOT NULL,
        data TEXT,
        INDEX idx_expires (expires)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Database tables initialized successfully');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Export the pool and functions
export { 
  pool, 
  initializeDatabase, 
  testConnection, 
  MySQLSessionStore 
};