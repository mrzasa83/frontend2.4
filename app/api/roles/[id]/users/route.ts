import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

// POST - Add user to role
export async function POST(
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
    const { id: roleId } = await params
    const { userId } = await request.json()

    // Check if already exists
    const existing = await queryPrimary<any[]>(
      'SELECT * FROM user_roles WHERE userId = ? AND roleId = ?',
      [userId, roleId]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'User already has this role' },
        { status: 409 }
      )
    }

    await queryPrimary(
      'INSERT INTO user_roles (userId, roleId, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())',
      [userId, roleId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding user to role:', error)
    return NextResponse.json(
      { error: 'Failed to add user to role' },
      { status: 500 }
    )
  }
}

// DELETE - Remove user from role
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
    const { id: roleId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    await queryPrimary(
      'DELETE FROM user_roles WHERE userId = ? AND roleId = ?',
      [userId, roleId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing user from role:', error)
    return NextResponse.json(
      { error: 'Failed to remove user from role' },
      { status: 500 }
    )
  }
}