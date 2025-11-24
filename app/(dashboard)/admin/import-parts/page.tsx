'use client'

import { useState, useEffect } from 'react'
import { Search, Upload, RefreshCw, CheckCircle, AlertCircle, Folder } from 'lucide-react'

type ScannedPart = {
  apcPN: string
  folderName: string
  fullPath: string
  customer?: string
  customerPN?: string
  currentRev?: string
  item_type_id: number
  existsInDB: boolean
}

type ScanResult = {
  total: number
  existing: number
  new: number
  parts: ScannedPart[]
}

const itemTypeNames: { [key: number]: string } = {
  1: 'Piece Part',
  2: 'Connector',
  3: 'Test Vehicle',
  4: 'Circuit Card Assembly',
  5: 'Printed Circuit Board'
}

// Helper to create unique key for a part
const getPartKey = (part: ScannedPart) => `${part.apcPN}|${part.fullPath}`

export default function ImportPartsPage() {
  const [scanning, setScanning] = useState(false)
  const [importing, setImporting] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'new' | 'existing'>('new')
  const [searchTerm, setSearchTerm] = useState('')

  const handleScan = async () => {
    setScanning(true)
    setScanResult(null)
    setSelectedParts(new Set())

    try {
      const res = await fetch('/api/admin/scan-parts')
      
      if (!res.ok) {
        throw new Error('Failed to scan parts')
      }

      const data = await res.json()
      setScanResult(data)
      
      // Auto-select all new parts
      const newParts = data.parts.filter((p: ScannedPart) => !p.existsInDB)
      setSelectedParts(new Set(newParts.map((p: ScannedPart) => getPartKey(p))))
    } catch (error) {
      console.error('Error scanning:', error)
      alert('Failed to scan parts. Check console for details.')
    } finally {
      setScanning(false)
    }
  }

  const handleImport = async () => {
    if (!scanResult || selectedParts.size === 0) return

    const partsToImport = scanResult.parts.filter(p => selectedParts.has(getPartKey(p)))

    setImporting(true)

    try {
      const res = await fetch('/api/admin/import-parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parts: partsToImport })
      })

      if (!res.ok) {
        throw new Error('Failed to import parts')
      }

      const result = await res.json()
      
      let message = `Import complete!\nImported: ${result.imported}\nSkipped: ${result.skipped}`
      if (result.errors.length > 0) {
        message += `\n\nErrors (${result.errors.length}):\n${result.errors.slice(0, 5).join('\n')}`
        if (result.errors.length > 5) {
          message += `\n... and ${result.errors.length - 5} more`
        }
      }
      alert(message)
      
      // Re-scan to refresh
      handleScan()
    } catch (error) {
      console.error('Error importing:', error)
      alert('Failed to import parts. Check console for details.')
    } finally {
      setImporting(false)
    }
  }

  const togglePart = (partKey: string) => {
    const newSelected = new Set(selectedParts)
    if (newSelected.has(partKey)) {
      newSelected.delete(partKey)
    } else {
      newSelected.add(partKey)
    }
    setSelectedParts(newSelected)
  }

  const toggleAll = () => {
    const filtered = getFilteredParts()
    const allKeys = filtered.map(p => getPartKey(p))
    
    if (selectedParts.size === filtered.length) {
      setSelectedParts(new Set())
    } else {
      setSelectedParts(new Set(allKeys))
    }
  }

  const getFilteredParts = (): ScannedPart[] => {
    if (!scanResult) return []

    let filtered = scanResult.parts

    // Apply status filter
    if (filter === 'new') {
      filtered = filtered.filter(p => !p.existsInDB)
    } else if (filter === 'existing') {
      filtered = filtered.filter(p => p.existsInDB)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        p.apcPN.toLowerCase().includes(term) ||
        p.folderName.toLowerCase().includes(term) ||
        p.customer?.toLowerCase().includes(term) ||
        p.customerPN?.toLowerCase().includes(term)
      )
    }

    return filtered
  }

  const filteredParts = getFilteredParts()

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Import Parts</h2>
      <p className="text-slate-600 mb-6">Scan network drive and import parts into the database</p>

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
                  <Search size={18} />
                  Scan Network Drive
                </>
              )}
            </button>

            {scanResult && (
              <button
                onClick={handleImport}
                disabled={importing || selectedParts.size === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Import Selected ({selectedParts.size})
                  </>
                )}
              </button>
            )}
          </div>

          {scanResult && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Folder className="text-slate-400" size={16} />
                <span className="text-slate-600">Total: {scanResult.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-600" size={16} />
                <span className="text-slate-600">New: {scanResult.new}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="text-orange-600" size={16} />
                <span className="text-slate-600">Existing: {scanResult.existing}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Scan Path:</strong> /mnt/jdrive/APC EngJobs/
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Only folders matching pattern #####-##### will be scanned. Part folders must start with 5 digits.
          </p>
        </div>
      </div>

      {/* Results Table */}
      {scanResult && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              {/* Search */}
              <input
                type="text"
                placeholder="Search parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg w-80 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />

              {/* Filters */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({scanResult.total})
                </button>
                <button
                  onClick={() => setFilter('new')}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    filter === 'new'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  New ({scanResult.new})
                </button>
                <button
                  onClick={() => setFilter('existing')}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    filter === 'existing'
                      ? 'bg-orange-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Existing ({scanResult.existing})
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={filteredParts.length > 0 && selectedParts.size === filteredParts.length}
                      onChange={toggleAll}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">APC PN</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Customer PN</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Rev</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Folder Name</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.map((part, index) => {
                  const partKey = getPartKey(part)
                  return (
                    <tr
                      key={partKey}
                      className={`border-t border-slate-200 hover:bg-slate-50 ${
                        part.existsInDB ? 'bg-orange-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedParts.has(partKey)}
                          onChange={() => togglePart(partKey)}
                          disabled={part.existsInDB}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {part.existsInDB ? (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                            Exists
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                            New
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{part.apcPN}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {itemTypeNames[part.item_type_id]}
                      </td>
                      <td className="px-4 py-3 text-sm">{part.customer || '-'}</td>
                      <td className="px-4 py-3 text-sm font-mono">{part.customerPN || '-'}</td>
                      <td className="px-4 py-3 text-sm">{part.currentRev || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 max-w-md truncate" title={part.folderName}>
                        {part.folderName}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filteredParts.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                No parts found matching current filters
              </div>
            )}
          </div>
        </div>
      )}

      {!scanResult && !scanning && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Folder className="mx-auto text-slate-300 mb-4" size={64} />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            No Scan Results
          </h3>
          <p className="text-slate-600 mb-4">
            Click "Scan Network Drive" to begin scanning for parts
          </p>
        </div>
      )}
    </div>
  )
}