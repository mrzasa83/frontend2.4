'use client'

import { useState } from 'react'
import { RefreshCw, Upload, AlertTriangle } from 'lucide-react'

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

type ComparisonResult = {
  total: number
  mismatches: number
  newParts: number
  comparisons: PartComparison[]
}

export default function SyncPartsPage() {
  const [scanning, setScanning] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set())
  const [selectedFields, setSelectedFields] = useState<Map<string, Set<string>>>(new Map())

  const handleScan = async () => {
    setScanning(true)
    setResult(null)
    setSelectedParts(new Set())
    setSelectedFields(new Map())

    try {
      const res = await fetch('/api/admin/sync-parts')
      
      if (!res.ok) {
        throw new Error('Failed to scan and compare')
      }

      const data = await res.json()
      setResult(data)
      
      // Auto-select all parts with differences
      const withDiffs = data.comparisons.filter((c: PartComparison) => c.existsInDB)
      setSelectedParts(new Set(withDiffs.map((c: PartComparison) => c.apcPN)))
      
      // Auto-select all different fields
      const fieldMap = new Map()
      withDiffs.forEach((c: PartComparison) => {
        const diffFields = c.differences.filter(d => d.isDifferent).map(d => d.field)
        fieldMap.set(c.apcPN, new Set(diffFields))
      })
      setSelectedFields(fieldMap)
      
    } catch (error) {
      console.error('Error scanning:', error)
      alert('Failed to scan and compare. Check console for details.')
    } finally {
      setScanning(false)
    }
  }

  const handleSync = async () => {
    if (!result || selectedParts.size === 0) return

    setSyncing(true)

    try {
      const updates = result.comparisons
        .filter(c => selectedParts.has(c.apcPN) && c.existsInDB)
        .map(c => {
          const fields = selectedFields.get(c.apcPN) || new Set()
          const update: any = { apcPN: c.apcPN, dbId: c.dbId }
          
          c.differences.forEach(diff => {
            if (fields.has(diff.field)) {
              update[diff.field] = diff.folderValue
            }
          })
          
          return update
        })

      const res = await fetch('/api/admin/sync-parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })

      if (!res.ok) {
        throw new Error('Failed to sync')
      }

      const syncResult = await res.json()
      alert(`Sync complete!\nUpdated: ${syncResult.updated}\nErrors: ${syncResult.errors.length}`)
      
      // Re-scan
      handleScan()
    } catch (error) {
      console.error('Error syncing:', error)
      alert('Failed to sync. Check console for details.')
    } finally {
      setSyncing(false)
    }
  }

  const togglePart = (apcPN: string) => {
    const newSelected = new Set(selectedParts)
    if (newSelected.has(apcPN)) {
      newSelected.delete(apcPN)
    } else {
      newSelected.add(apcPN)
    }
    setSelectedParts(newSelected)
  }

  const toggleField = (apcPN: string, field: string) => {
    const newFieldMap = new Map(selectedFields)
    const fields = newFieldMap.get(apcPN) || new Set()
    
    if (fields.has(field)) {
      fields.delete(field)
    } else {
      fields.add(field)
    }
    
    newFieldMap.set(apcPN, fields)
    setSelectedFields(newFieldMap)
  }

  const getFieldLabel = (field: string) => {
    const labels: { [key: string]: string } = {
      customer: 'Customer',
      customerPN: 'Customer PN',
      currentRev: 'Revision',
      fullPath: 'Path'
    }
    return labels[field] || field
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Sync Parts</h2>
      <p className="text-slate-600 mb-6">Compare folder data with database and sync differences</p>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleScan}
              disabled={scanning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scanning ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Scan & Compare
                </>
              )}
            </button>

            {result && result.mismatches > 0 && (
              <button
                onClick={handleSync}
                disabled={syncing || selectedParts.size === 0}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Sync Selected ({selectedParts.size})
                  </>
                )}
              </button>
            )}
          </div>

          {result && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-600">Total: {result.total}</span>
              <span className="text-orange-600 font-semibold">Mismatches: {result.mismatches}</span>
              <span className="text-green-600">New: {result.newParts}</span>
            </div>
          )}
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-orange-600 flex-shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-orange-800">
              <strong>Warning:</strong> This will overwrite database values with folder information. 
              Review carefully before syncing. Select which fields to update for each part.
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && result.comparisons.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">
              Parts with Differences ({result.comparisons.filter(c => c.existsInDB).length})
            </h3>
          </div>

          <div className="divide-y divide-slate-200">
            {result.comparisons.filter(c => c.existsInDB).map((comparison) => (
              <div key={comparison.apcPN} className="p-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedParts.has(comparison.apcPN)}
                    onChange={() => togglePart(comparison.apcPN)}
                    className="mt-1 rounded border-slate-300"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-mono font-semibold text-slate-800">
                          {comparison.apcPN}
                        </h4>
                        <p className="text-sm text-slate-500">{comparison.folderName}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {comparison.differences.filter(d => d.isDifferent).map((diff) => {
                        const isSelected = selectedFields.get(comparison.apcPN)?.has(diff.field)
                        
                        return (
                          <div 
                            key={diff.field}
                            className={`border rounded-lg p-3 ${
                              isSelected ? 'border-orange-300 bg-orange-50' : 'border-slate-200'
                            }`}
                          >
                            <div className="flex items-start gap-2 mb-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleField(comparison.apcPN, diff.field)}
                                className="mt-1 rounded border-slate-300"
                              />
                              <label className="text-sm font-medium text-slate-700">
                                {getFieldLabel(diff.field)}
                              </label>
                            </div>
                            <div className="ml-6 space-y-1 text-sm">
                              <div>
                                <span className="text-slate-500">DB:</span>{' '}
                                <span className="text-red-600">{diff.dbValue || '(empty)'}</span>
                              </div>
                              <div>
                                <span className="text-slate-500">Folder:</span>{' '}
                                <span className="text-green-600">{diff.folderValue || '(empty)'}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && result.comparisons.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-slate-500">No differences found. Database is in sync with folders! ✓</p>
        </div>
      )}

      {!result && !scanning && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <RefreshCw className="mx-auto text-slate-300 mb-4" size={64} />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            No Comparison Results
          </h3>
          <p className="text-slate-600">
            Click "Scan & Compare" to find differences between folders and database
          </p>
        </div>
      )}
    </div>
  )
}