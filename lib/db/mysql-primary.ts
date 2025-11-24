import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getMySQLPrimaryPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_MYSQL_PRIMARY_HOST,
      port: parseInt(process.env.DB_MYSQL_PRIMARY_PORT || '3306'),
      user: process.env.DB_MYSQL_PRIMARY_USER,
      password: process.env.DB_MYSQL_PRIMARY_PASSWORD,
      database: process.env.DB_MYSQL_PRIMARY_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    })
  }
  return pool
}

export async function queryPrimary<T = any>(
  sql: string,
  params?: any[]
): Promise<T> {
  const pool = getMySQLPrimaryPool()
  const [rows] = await pool.execute(sql, params)
  return rows as T
}

// Test connection
export async function testMySQLPrimaryConnection() {
  try {
    const pool = getMySQLPrimaryPool()
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    return { success: true, message: 'MySQL Primary connected' }
  } catch (error) {
    return { success: false, message: `MySQL Primary error: ${error}` }
  }
}

// At the end of mysql-primary.ts
export async function getUsers() {
  return queryPrimary<any[]>(
    `SELECT 
      id,
      username,
      name,
      email,
      nickname,
      phone,
      mobile,
      title,
      role,
      active
    FROM Users 
    WHERE active = 1
    ORDER BY name ASC`
  )
}