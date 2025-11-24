import fs from 'fs/promises'
import path from 'path'
import { ScannedPart, parseFolderName, getItemTypeFromPartNumber } from '@/lib/types/items'

const BASE_PATH = '/mnt/jdrive/APC EngJobs'

// Check if folder name matches range pattern: #####-#####
function isRangeFolder(name: string): boolean {
  return /^\d{5}-\d{5}$/.test(name)
}

// Check if folder name is a part folder: ##### or ##### followed by space
function isPartFolder(name: string): boolean {
  return /^\d{5}(\s|$)/.test(name)
}

// Scan a single range folder for parts
async function scanRangeFolder(rangeFolderPath: string): Promise<ScannedPart[]> {
  const parts: ScannedPart[] = []
  
  try {
    const entries = await fs.readdir(rangeFolderPath, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isDirectory() && isPartFolder(entry.name)) {
        const parsed = parseFolderName(entry.name)
        const fullPath = path.join(rangeFolderPath, entry.name)
        
        parts.push({
          apcPN: parsed.apcPN,
          folderName: entry.name,
          fullPath,
          customer: parsed.customer,
          customerPN: parsed.customerPN,
          currentRev: parsed.currentRev,
          item_type_id: getItemTypeFromPartNumber(parsed.apcPN),
          existsInDB: false  // Will be checked later
        })
      }
    }
  } catch (error) {
    console.error(`Error scanning range folder ${rangeFolderPath}:`, error)
  }
  
  return parts
}

// Scan all range folders in base path
export async function scanAllParts(): Promise<ScannedPart[]> {
  const allParts: ScannedPart[] = []
  
  try {
    const entries = await fs.readdir(BASE_PATH, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isDirectory() && isRangeFolder(entry.name)) {
        const rangePath = path.join(BASE_PATH, entry.name)
        const parts = await scanRangeFolder(rangePath)
        allParts.push(...parts)
      }
    }
  } catch (error) {
    console.error(`Error scanning base path ${BASE_PATH}:`, error)
    throw error
  }
  
  return allParts
}

// Get list of range folders
export async function getRangeFolders(): Promise<string[]> {
  try {
    const entries = await fs.readdir(BASE_PATH, { withFileTypes: true })
    return entries
      .filter(entry => entry.isDirectory() && isRangeFolder(entry.name))
      .map(entry => entry.name)
      .sort()
  } catch (error) {
    console.error(`Error getting range folders:`, error)
    return []
  }
}

// Scan specific range folders
export async function scanSpecificRanges(ranges: string[]): Promise<ScannedPart[]> {
  const allParts: ScannedPart[] = []
  
  for (const range of ranges) {
    const rangePath = path.join(BASE_PATH, range)
    const parts = await scanRangeFolder(rangePath)
    allParts.push(...parts)
  }
  
  return allParts
}