import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { scanAllParts } from '@/lib/importers/part-scanner'
import { queryPrimary } from '@/lib/db/mysql-primary'

type FieldDiff = {
  field: string
  dbValue: any
  folderValue: any
  isDifferent: boolean
}

type PartComparison = {
  apcPN: string
  folderName: string
  fullPath: string
  differences: FieldDiff[]
  existsInDB: boolean
  dbId?: number
}

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Scan filesystem
    const scannedParts = await scanAllParts()
    
    // Get all existing parts from DB
    const dbParts = await queryPrimary<any[]>(
      `SELECT id, apcPN, customer, customerPN, currentRev, fullPath FROM items WHERE m_item_type_id = 1`
    )
    
    // Create map for quick lookup
    const dbPartsMap = new Map(dbParts.map(p => [p.apcPN, p]))
    
    // Compare each scanned part with DB
    const comparisons: PartComparison[] = []
    
    for (const scanned of scannedParts) {
      const dbPart = dbPartsMap.get(scanned.apcPN)
      
      if (!dbPart) {
        // Part doesn't exist in DB
        comparisons.push({
          apcPN: scanned.apcPN,
          folderName: scanned.folderName,
          fullPath: scanned.fullPath,
          differences: [],
          existsInDB: false
        })
        continue
      }
      
      // Compare fields
      const differences: FieldDiff[] = [
        {
          field: 'customer',
          dbValue: dbPart.customer,
          folderValue: scanned.customer,
          isDifferent: dbPart.customer !== scanned.customer
        },
        {
          field: 'customerPN',
          dbValue: dbPart.customerPN,
          folderValue: scanned.customerPN,
          isDifferent: dbPart.customerPN !== scanned.customerPN
        },
        {
          field: 'currentRev',
          dbValue: dbPart.currentRev,
          folderValue: scanned.currentRev,
          isDifferent: dbPart.currentRev !== scanned.currentRev
        },
        {
          field: 'fullPath',
          dbValue: dbPart.fullPath,
          folderValue: scanned.fullPath,
          isDifferent: dbPart.fullPath !== scanned.fullPath
        }
      ]
      
      const hasDifferences = differences.some(d => d.isDifferent)
      
      if (hasDifferences) {
        comparisons.push({
          apcPN: scanned.apcPN,
          folderName: scanned.folderName,
          fullPath: scanned.fullPath,
          differences,
          existsInDB: true,
          dbId: dbPart.id
        })
      }
    }
    
    return NextResponse.json({
      total: scannedParts.length,
      mismatches: comparisons.filter(c => c.existsInDB).length,
      newParts: comparisons.filter(c => !c.existsInDB).length,
      comparisons
    })
  } catch (error) {
    console.error('Error comparing parts:', error)
    return NextResponse.json(
      { error: 'Failed to compare parts', details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { updates } = await request.json()
    
    let updated = 0
    const errors: string[] = []
    
    for (const update of updates) {
      try {
        await queryPrimary(
          `UPDATE items SET 
            customer = ?,
            customerPN = ?,
            currentRev = ?,
            fullPath = ?
          WHERE id = ?`,
          [
            update.customer,
            update.customerPN,
            update.currentRev,
            update.fullPath,
            update.dbId
          ]
        )
        updated++
      } catch (error) {
        errors.push(`${update.apcPN}: ${error}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      updated,
      errors
    })
  } catch (error) {
    console.error('Error syncing parts:', error)
    return NextResponse.json(
      { error: 'Failed to sync parts', details: String(error) },
      { status: 500 }
    )
  }
}