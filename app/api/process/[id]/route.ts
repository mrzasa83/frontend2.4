import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    const items = await queryPrimary<any[]>(
      `SELECT 
        i.id,
        i.apcPN,
        i.customer,
        i.customerPN,
        i.buildRev,
        i.currentRev,
        i.description,
        i.fullPath,
        i.createdAt,
        i.m_item_type_id,
        i.item_type_id,
        it.name as item_type_name,
        it.code as item_type_code
      FROM items i
      LEFT JOIN item_types it ON i.item_type_id = it.id
      WHERE i.id = ?`,
      [id]
    )

    if (items.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(items[0])
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    const { id } = await params

    await queryPrimary(
      `UPDATE items SET 
        customer = ?,
        customerPN = ?,
        currentRev = ?,
        description = ?,
        fullPath = ?
      WHERE id = ?`,
      [
        data.customer || null,
        data.customerPN || null,
        data.currentRev || null,
        data.description || null,
        data.fullPath || null,
        id
      ]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}