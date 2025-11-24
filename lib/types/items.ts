export type MajorItemType = 'part' | 'doc'

export type ItemTypeCode = 'PIE' | 'CON' | 'T_V' | 'CCA' | 'PCB'

export interface Item {
  id?: number
  apcPN: string
  customer?: string | null
  customerPN?: string | null
  buildRev?: string | null
  currentRev?: string | null
  description?: string | null
  fullPath?: string | null
  createdAt?: string
  m_item_type_id: number  // 1=part, 2=doc
  item_type_id: number    // 1=PIE, 2=CON, 3=T_V, 4=CCA, 5=PCB
}

export interface ScannedPart {
  apcPN: string
  folderName: string
  fullPath: string
  customer?: string
  customerPN?: string
  currentRev?: string
  item_type_id: number
  existsInDB: boolean
}

// Map first digit to item_type_id
export function getItemTypeFromPartNumber(partNumber: string): number {
  const firstDigit = partNumber.charAt(0)
  switch (firstDigit) {
    case '0': return 3  // Test Vehicle
    case '1': return 4  // Circuit Card Assembly
    case '3': return 2  // Connector
    case '7': return 5  // PCB
    case '9': return 1  // Piece Part
    default: return 1   // Default to Piece Part
  }
}

// Parse folder name: "12747 Harris 8026565-1" or "12710 BAE 1050468-0001 Rev E-A"
export function parseFolderName(folderName: string): {
  apcPN: string
  customer?: string
  customerPN?: string
  currentRev?: string
} {
  // Extract part number (first 5 digits)
  const apcPN = folderName.substring(0, 5)
  
  // Remove part number and trim
  let remaining = folderName.substring(5).trim()
  
  if (!remaining) {
    return { apcPN }
  }
  
  // Look for Rev pattern
  const revMatch = remaining.match(/\bRev\s+([A-Za-z0-9-]+)/i)
  let currentRev: string | undefined
  if (revMatch) {
    currentRev = revMatch[1]
    remaining = remaining.replace(revMatch[0], '').trim()
  }
  
  // Parse remaining as customer and customer PN
  // Simple heuristic: if there are 2+ words, first is customer, rest is customer PN
  const parts = remaining.split(/\s+/)
  
  if (parts.length === 0) {
    return { apcPN, currentRev }
  } else if (parts.length === 1) {
    // Could be customer or customer PN - hard to tell
    // If it looks like a part number (has digits/dashes), treat as customerPN
    if (/[\d-]/.test(parts[0])) {
      return { apcPN, customerPN: parts[0], currentRev }
    } else {
      return { apcPN, customer: parts[0], currentRev }
    }
  } else {
    // Multiple words: first word is customer, rest is customer PN
    const customer = parts[0]
    const customerPN = parts.slice(1).join(' ')
    return { apcPN, customer, customerPN, currentRev }
  }
}