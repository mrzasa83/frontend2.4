'use client'

import { useState } from 'react'
import { Play, Download, Trash2, Database } from 'lucide-react'

type QueryResult = {
  success: boolean
  columns: string[]
  results: any[]
  rowCount: number
  executionTime: number
}

const databases = [
  { id: 'Paradigm', name: 'Paradigm', type: 'MS SQL', description: 'Paradigm database' },
  { id: 'frontEnd2.0', name: 'frontEnd2.0', type: 'MySQL', description: 'Primary application database' },
  { id: 'Control Center', name: 'Control Center', type: 'MySQL', description: 'Secondary control database' },
  { id: 'Engenix', name: 'Engenix', type: 'MS SQL', description: 'Engenix database' }
]

const exampleQueries: { [key: string]: string[] } = {
  'frontEnd2.0': [
    'SELECT * FROM items LIMIT 10;',
    'SELECT apcPN, customer, currentRev FROM items WHERE customer IS NOT NULL LIMIT 25;',
    'SELECT item_type_id, COUNT(*) as count FROM items GROUP BY item_type_id;'
  ],
  'Control Center': [
    'SHOW TABLES;',
    'SELECT * FROM your_table LIMIT 10;'
  ],
  'Paradigm': [
    'SELECT TOP 10 * FROM your_table;',
    'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\';'
  ],
  'Engenix': [
    'SELECT TOP 10 * FROM your_table;',
    'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\';'
  ]
}

export default function SQLQueryPage() {
  const [selectedDB, setSelectedDB] = useState('Paradigm')
  const [query, setQuery] = useState('')
  const [executing, setExecuting] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExecute = async () => {
    if (!query.trim()) {
      alert('Please enter a query')
      return
    }

    setExecuting(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/admin/query-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database: selectedDB,
          query: query.trim()
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || data.details || 'Query failed')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setExecuting(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    setResult(null)
    setError(null)
  }

  const handleExport = () => {
    if (!result || result.results.length === 0) return

    const headers = result.columns.join(',')
    const rows = result.results.map(row =>
      result.columns.map(col => {
        const val = row[col]
        if (val === null || val === undefined) return ''
        const str = String(val)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(',')
    )

    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `query_result_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const insertExample = (exampleQuery: string) => {
    setQuery(exampleQuery)
  }

  const selectedDbInfo = databases.find(db => db.id === selectedDB)

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">SQL Query Tool</h2>
      <p className="text-slate-600 mb-6">Execute read-only queries against connected databases</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Query Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Query Editor */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 flex-1">
                <label className="text-sm font-medium text-slate-700">
                  Database:
                </label>
                <select
                  value={selectedDB}
                  onChange={(e) => setSelectedDB(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {databases.map(db => (
                    <option key={db.id} value={db.id}>
                      {db.name} ({db.type})
                    </option>
                  ))}
                </select>
                {selectedDbInfo && (
                  <span className="text-xs text-slate-500">{selectedDbInfo.description}</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleClear}
                  className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded transition-colors flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  Clear
                </button>
                <button
                  onClick={handleExecute}
                  disabled={executing || !query.trim()}
                  className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Play size={14} />
                  {executing ? 'Executing...' : 'Execute'}
                </button>
              </div>
            </div>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your SELECT query here..."
              rows={12}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />

            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                <strong>Note:</strong> Only SELECT queries are allowed for safety
              </div>
              {result && (
                <div className="text-xs text-slate-600">
                  Executed in {result.executionTime}ms
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <div className="text-red-600 font-semibold text-sm">Error:</div>
                <div className="text-red-700 text-sm flex-1 font-mono">{error}</div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">Query Results</h3>
                  <p className="text-sm text-slate-600">{result.rowCount} rows returned</p>
                </div>
                {result.rowCount > 0 && (
                  <button
                    onClick={handleExport}
                    className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-2"
                  >
                    <Download size={14} />
                    Export CSV
                  </button>
                )}
              </div>

              {result.rowCount > 0 ? (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 sticky top-0">
                      <tr>
                        {result.columns.map((col, i) => (
                          <th key={i} className="px-4 py-2 text-left font-medium text-slate-700 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.results.map((row, i) => (
                        <tr key={i} className="border-t border-slate-200 hover:bg-slate-50">
                          {result.columns.map((col, j) => (
                            <td key={j} className="px-4 py-2 whitespace-nowrap text-slate-600">
                              {row[col] === null ? <span className="text-slate-400 italic">null</span> : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  Query executed successfully but returned no rows
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Example Queries */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Example Queries</h3>
            <div className="space-y-2">
              {exampleQueries[selectedDB]?.map((example, i) => (
                <button
                  key={i}
                  onClick={() => insertExample(example)}
                  className="w-full text-left px-3 py-2 text-xs font-mono bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors break-all"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">Tips</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Use LIMIT (MySQL) or TOP (MS SQL) to restrict results</li>
              <li>• Click example queries to insert them</li>
              <li>• Results are automatically formatted</li>
              <li>• Export large result sets to CSV</li>
              <li>• Queries timeout after 30 seconds</li>
            </ul>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-900 text-sm mb-2">⚠️ Safety</h4>
            <ul className="text-xs text-orange-800 space-y-1">
              <li>• Only SELECT queries allowed</li>
              <li>• No modifications to data</li>
              <li>• No schema changes permitted</li>
              <li>• All queries are logged</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}