import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { scanAllParts, getRangeFolders, scanSpecificRanges } from '@/lib/importers/part-scanner'
import { queryPrimary } from '@/lib/db/mysql-primary'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: Check if user has admin role
  
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  try {
    if (action === 'list-ranges') {
      const ranges = await getRangeFolders()
      return NextResponse.json({ ranges })
    }
    
    // Get ranges to scan (or all if not specified)
    const rangesParam = searchParams.get('ranges')
    const ranges = rangesParam ? rangesParam.split(',') : null
    
    // Scan filesystem
    const scannedParts = ranges 
      ? await scanSpecificRanges(ranges)
      : await scanAllParts()
    
    console.log(`Scanned ${scannedParts.length} parts from filesystem`)
    
    // Check which parts already exist in DB (by apcPN only)
    if (scannedParts.length > 0) {
      const uniquePNs = [...new Set(scannedParts.map(p => p.apcPN))]
      
      if (uniquePNs.length > 0) {
        const placeholders = uniquePNs.map(() => '?').join(',')
        const existingParts = await queryPrimary<{ apcPN: string }[]>(
          `SELECT DISTINCT apcPN FROM items WHERE apcPN IN (${placeholders})`,
          uniquePNs
        )
        
        const existingSet = new Set(existingParts.map(p => p.apcPN))
        
        scannedParts.forEach(part => {
          part.existsInDB = existingSet.has(part.apcPN)
        })
      }
    }
    
    const existingCount = scannedParts.filter(p => p.existsInDB).length
    const newCount = scannedParts.filter(p => !p.existsInDB).length
    
    console.log(`Found ${newCount} new parts, ${existingCount} existing`)
    
    return NextResponse.json({
      total: scannedParts.length,
      existing: existingCount,
      new: newCount,
      parts: scannedParts
    })
  } catch (error) {
    console.error('Error scanning parts:', error)
    return NextResponse.json(
      { error: 'Failed to scan parts', details: String(error) },
      { status: 500 }
    )
  }
}