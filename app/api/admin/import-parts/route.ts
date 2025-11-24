import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { queryPrimary } from '@/lib/db/mysql-primary'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: Check if user has admin role
  
  try {
    const { parts } = await request.json()
    
    if (!Array.isArray(parts) || parts.length === 0) {
      return NextResponse.json({ error: 'No parts to import' }, { status: 400 })
    }
    
    let imported = 0
    let skipped = 0
    const errors: string[] = []
    
    for (const part of parts) {
      try {
        console.log('Processing part:', part.apcPN, part.fullPath)
        
        // Check if already exists by apcPN only
        const existing = await queryPrimary<any[]>(
          'SELECT id FROM items WHERE apcPN = ?',
          [part.apcPN]
        )
        
        if (existing.length > 0) {
          console.log('Skipping existing part:', part.apcPN)
          skipped++
          continue
        }
        
        // Insert new part
        const result = await queryPrimary(
          `INSERT INTO items (
            apcPN,
            customer,
            customerPN,
            currentRev,
            description,
            fullPath,
            m_item_type_id,
            item_type_id,
            createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            part.apcPN,
            part.customer || null,
            part.customerPN || null,
            part.currentRev || null,
            null,  // description left empty for now
            part.fullPath,
            1,  // m_item_type_id = 1 (Part)
            part.item_type_id
          ]
        )
        
        console.log('Imported part:', part.apcPN, 'Result:', result)
        imported++
      } catch (error) {
        const errorMsg = `${part.apcPN}: ${error instanceof Error ? error.message : String(error)}`
        console.error('Error importing part:', errorMsg)
        errors.push(errorMsg)
      }
    }
    
    console.log('Import complete. Imported:', imported, 'Skipped:', skipped, 'Errors:', errors.length)
    
    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors
    })
  } catch (error) {
    console.error('Error importing parts:', error)
    return NextResponse.json(
      { error: 'Failed to import parts', details: String(error) },
      { status: 500 }
    )
  }
}