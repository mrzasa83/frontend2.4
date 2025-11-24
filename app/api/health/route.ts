import { NextResponse } from 'next/server'
import { testMySQLPrimaryConnection } from '@/lib/db/mysql-primary'
import { testMSSQLConnection } from '@/lib/db/mssql'

export async function GET() {
  const checks = {
    mysqlPrimary: await testMySQLPrimaryConnection(),
    // Add your MSSQL connections
    // mssql1: await testMSSQLConnection('1'),
    // mssql2: await testMSSQLConnection('2'),
  }

  const allHealthy = Object.values(checks).every(check => check.success)

  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  }, {
    status: allHealthy ? 200 : 503
  })
}