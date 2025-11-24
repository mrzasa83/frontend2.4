import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

// GET - Fetch role details with users
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = session.user?.roles?.includes('admin')
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  try {
    const { id } = await params

    // Get role info
    const roles = await queryPrimary<any[]>(
      'SELECT id, name, createdAt, updatedAt FROM roles WHERE id = ?',
      [id]
    )

    if (roles.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Get users in this role
    const users = await queryPrimary<any[]>(
      `SELECT u.id, u.username, u.name, u.email
       FROM Users u
       INNER JOIN user_roles ur ON u.id = ur.userId
       WHERE ur.roleId = ?
       ORDER BY u.name ASC`,
      [id]
    )

    return NextResponse.json({
      ...roles[0],
      users
    })
  } catch (error) {
    console.error('Error fetching role:', error)
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    )
  }
}

// PUT - Update role name
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = session.user?.roles?.includes('admin')
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  try {
    const { id } = await params
    const { name } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      )
    }

    await queryPrimary(
      'UPDATE roles SET name = ?, updatedAt = NOW() WHERE id = ?',
      [name, id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}

// DELETE - Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = session.user?.roles?.includes('admin')
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  try {
    const { id } = await params

    // Delete user associations first
    await queryPrimary('DELETE FROM user_roles WHERE roleId = ?', [id])
    
    // Delete role
    await queryPrimary('DELETE FROM roles WHERE id = ?', [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    )
  }
}