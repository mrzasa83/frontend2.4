import sql from 'mssql'

// Connection pools
const pools: { [key: string]: sql.ConnectionPool } = {}

export interface MSSQLConfig {
  name: string
  host: string
  port: number
  user: string
  password: string
  database: string
}

export function getMSSQLConfig(name: string): MSSQLConfig | null {
  const host = process.env[`DB_MSSQL_${name}_HOST`]
  const port = process.env[`DB_MSSQL_${name}_PORT`]
  const user = process.env[`DB_MSSQL_${name}_USER`]
  const password = process.env[`DB_MSSQL_${name}_PASSWORD`]
  const database = process.env[`DB_MSSQL_${name}_DATABASE`]

  if (!host || !user || !password || !database) {
    return null
  }

  return {
    name,
    host,
    port: parseInt(port || '1433'),
    user,
    password, // Password will be used directly, not in connection string
    database
  }
}

export async function getMSSQLPool(name: string): Promise<sql.ConnectionPool> {
  if (pools[name]) {
    return pools[name]
  }

  const config = getMSSQLConfig(name)
  if (!config) {
    throw new Error(`MSSQL configuration not found for: ${name}`)
  }

  const pool = new sql.ConnectionPool({
    server: config.host,
    port: config.port,
    user: config.user,
    password: config.password, // Pass password directly as string
    database: config.database,
    options: {
      encrypt: false, // Set to true if using Azure
      trustServerCertificate: true,
      enableArithAbort: true
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  })

  await pool.connect()
  pools[name] = pool
  return pool
}

export async function queryMSSQL<T = any>(
  name: string,
  query: string,
  params?: { [key: string]: any }
): Promise<T> {
  const pool = await getMSSQLPool(name)
  const request = pool.request()

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value)
    })
  }

  const result = await request.query(query)
  return result.recordset as T
}

// Test connection
export async function testMSSQLConnection(name: string) {
  try {
    const pool = await getMSSQLPool(name)
    await pool.query('SELECT 1 as test')
    return { success: true, message: `MSSQL ${name} connected` }
  } catch (error) {
    return { success: false, message: `MSSQL ${name} error: ${error}` }
  }
}

