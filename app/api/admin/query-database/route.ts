import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMySQLPrimaryPool } from '@/lib/db/mysql-primary'
import { getMySQLSecondaryPool } from '@/lib/db/mysql-secondary'
import { queryMSSQL } from '@/lib/db/mssql'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { database, query } = await request.json()

    if (!database || !query) {
      return NextResponse.json(
        { error: 'Database and query are required' },
        { status: 400 }
      )
    }

    // Prevent dangerous operations
    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE']
    const upperQuery = query.trim().toUpperCase()
    const hasSemicolon = upperQuery.includes(';')
    
    // Check if query starts with dangerous keyword or has multiple statements
    const isDangerous = dangerousKeywords.some(keyword => {
      if (upperQuery.startsWith(keyword)) return true
      if (hasSemicolon && upperQuery.split(';').some((stmt: string) => stmt.trim().startsWith(keyword))) return true
      return false
    })

    if (isDangerous) {
      return NextResponse.json(
        { error: 'Only SELECT queries are allowed for safety' },
        { status: 403 }
      )
    }

    console.log(`Executing query on ${database}:`, query)

    let results: any[] = []
    let columns: string[] = []
    const startTime = Date.now()

    try {
      switch (database) {
        case 'frontEnd2.0': {
          const pool = getMySQLPrimaryPool()
          const [rows] = await pool.execute(query)
          results = rows as any[]
          if (results.length > 0) {
            columns = Object.keys(results[0])
          }
          break
        }

        case 'Control Center': {
          const pool = getMySQLSecondaryPool()
          const [rows] = await pool.execute(query)
          results = rows as any[]
          if (results.length > 0) {
            columns = Object.keys(results[0])
          }
          break
        }

        case 'Paradigm': {
          results = await queryMSSQL('1', query)
          if (results.length > 0) {
            columns = Object.keys(results[0])
          }
          break
        }

        case 'Engenix': {
          results = await queryMSSQL('2', query)
          if (results.length > 0) {
            columns = Object.keys(results[0])
          }
          break
        }

        default:
          return NextResponse.json(
            { error: 'Invalid database selected' },
            { status: 400 }
          )
      }

      const executionTime = Date.now() - startTime

      return NextResponse.json({
        success: true,
        columns,
        results,
        rowCount: results.length,
        executionTime
      })
    } catch (queryError) {
      console.error('Query execution error:', queryError)
      throw queryError
    }
  } catch (error) {
    console.error('Query error:', error)
    return NextResponse.json(
      {
        error: 'Query execution failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}