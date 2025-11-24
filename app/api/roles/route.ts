import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

// GET - Fetch all roles with user count
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const isAdmin = session.user?.roles?.includes('admin')
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  try {
    const roles = await queryPrimary<any[]>(
      `SELECT 
        r.id,
        r.name,
        r.createdAt,
        r.updatedAt,
        COUNT(DISTINCT ur.userId) as userCount
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.roleId
      GROUP BY r.id, r.name, r.createdAt, r.updatedAt
      ORDER BY r.name ASC`
    )

    return NextResponse.json(roles)
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}

// POST - Create new role
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = session.user?.roles?.includes('admin')
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  try {
    const { name } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      )
    }

    // Check if role already exists
    const existing = await queryPrimary<any[]>(
      'SELECT id FROM roles WHERE name = ?',
      [name]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Role already exists' },
        { status: 409 }
      )
    }

    // Get the next available ID
    const maxIdResult = await queryPrimary<any[]>(
      'SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM roles'
    )
    const nextId = maxIdResult[0].nextId

    // Insert new role with explicit ID
    await queryPrimary(
      'INSERT INTO roles (id, name, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())',
      [nextId, name]
    )

    return NextResponse.json({
      success: true,
      roleId: nextId
    })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json(
      { error: 'Failed to create role', details: String(error) },
      { status: 500 }
    )
  }
}