import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Test SELECT
    const users = await queryPrimary('SELECT COUNT(*) as count FROM Users')
    
    // Test UPDATE (safe test on a single field)
    const testUpdate = await queryPrimary(
      'UPDATE Users SET updatedAt = NOW() WHERE id = ?',
      [1] // Replace with a valid user ID
    )

    return NextResponse.json({
      success: true,
      userCount: users,
      testUpdate: testUpdate,
      message: 'Database read/write working'
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { error: 'Database test failed', details: String(error) },
      { status: 500 }
    )
  }
}