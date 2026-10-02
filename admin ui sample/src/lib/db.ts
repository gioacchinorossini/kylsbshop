import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sizgrillpos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+08:00'
});

export default pool;

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const [results] = await pool.execute(sql, params);
  return results as T;
}
