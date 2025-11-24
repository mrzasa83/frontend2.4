import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getMySQLSecondaryPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_MYSQL_SECONDARY_HOST,
      port: parseInt(process.env.DB_MYSQL_SECONDARY_PORT || '3306'),
      user: process.env.DB_MYSQL_SECONDARY_USER,
      password: process.env.DB_MYSQL_SECONDARY_PASSWORD,
      database: process.env.DB_MYSQL_SECONDARY_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    })
  }
  return pool
}

export async function querySecondary<T = any>(
  sql: string,
  params?: any[]
): Promise<T> {
  const pool = getMySQLSecondaryPool()
  const [rows] = await pool.execute(sql, params)
  return rows as T
}