import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'liquidpos',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  charset: 'utf8mb4',
});

export const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL conectado');
    conn.release();
  } catch (err) {
    console.error('❌ Error de conexión MySQL:', err.message);
    process.exit(1);
  }
};

// Helpers
export const dbGet  = async (sql, params = []) => { const [rows] = await pool.execute(sql, params); return rows[0] || null; };
export const dbAll  = async (sql, params = []) => { const [rows] = await pool.execute(sql, params); return rows; };
export const dbRun  = async (sql, params = []) => { const [result] = await pool.execute(sql, params); return result; };
