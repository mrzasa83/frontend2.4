import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

type Item = {
  id: number
  apcPN: string
  customer: string | null
  customerPN: string | null
  buildRev: string | null
  currentRev: string | null
  description: string | null
  fullPath: string | null
  createdAt: string
  m_item_type_id: number
  item_type_id: number
  item_type_name?: string
}

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const items = await queryPrimary<Item[]>(
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
        it.name as item_type_name
      FROM items i
      LEFT JOIN item_types it ON i.item_type_id = it.id
      WHERE i.m_item_type_id = 1
      ORDER BY i.apcPN ASC`
    )

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}