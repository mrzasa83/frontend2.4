import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryMSSQL } from '@/lib/db/mssql'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { apcPN } = await request.json()

    if (!apcPN) {
      return NextResponse.json(
        { error: 'apcPN is required' },
        { status: 400 }
      )
    }

    // Query Paradigm MS SQL database
    // Using parameterized query to prevent SQL injection
    const query = `
      SELECT * 
      FROM data0050 
      WHERE customer_part_number LIKE @partNumber
      ORDER BY customer_part_number
    `

    const results = await queryMSSQL('1', query, {
      partNumber: `${apcPN}%`
    })

    return NextResponse.json({
      success: true,
      apcPN,
      count: results.length,
      results
    })
  } catch (error) {
    console.error('Error fetching production data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch production data', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}