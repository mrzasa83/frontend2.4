'use client'

import { Eye, Pencil } from 'lucide-react'

type Product = {
  id: number
  apcPN: string
  customer: string | null
  customerPN: string | null
  currentRev: string | null
  description: string | null
  fullPath: string | null
  item_type_name: string | null
  item_type_id: number
}

type TableState = {
  search: string
  sortKey: keyof Product
  sortAsc: boolean
  pageSize: number
  page: number
  typeFilter: string
}

type Props = {
  products: Product[]
  onView: (product: Product) => void
  onEdit: (product: Product) => void
  tableState: TableState
  onTableStateChange: (state: TableState) => void
}

export default function ProductTable({ products, onView, onEdit, tableState, onTableStateChange }: Props) {
  const { search, sortKey, sortAsc, pageSize, page, typeFilter } = tableState

  const updateState = (updates: Partial<TableState>) => {
    onTableStateChange({ ...tableState, ...updates })
  }

  // Get unique product types for filter
  const productTypes = Array.from(
    new Set(products.map(p => p.item_type_name).filter((t): t is string => t !== null && t !== undefined))
  ).sort()

  const filtered = products.filter((p) => {
    const matchesSearch = 
      p.apcPN.toLowerCase().includes(search.toLowerCase()) ||
      p.customer?.toLowerCase().includes(search.toLowerCase()) ||
      p.customerPN?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    
    const matchesType = !typeFilter || typeFilter === 'all' || p.item_type_name === typeFilter
    
    return matchesSearch && matchesType
  })

  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortKey] || ''
    const valB = b[sortKey] || ''
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA))
  })

  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.ceil(filtered.length / pageSize)

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => updateState({ search: e.target.value, page: 0 })}
          className="border border-slate-300 px-3 py-2 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        
        <select
          value={typeFilter || 'all'}
          onChange={(e) => updateState({ typeFilter: e.target.value, page: 0 })}
          className="border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="all">All Types</option>
          {productTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <select
          value={pageSize}
          onChange={(e) => updateState({ pageSize: Number(e.target.value), page: 0 })}
          className="border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          {[25, 50, 100, 250].map((size) => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              {[
                { key: 'apcPN', label: 'Part Number' },
                { key: 'item_type_name', label: 'Type' },
                { key: 'customer', label: 'Customer' },
                { key: 'customerPN', label: 'Customer PN' },
                { key: 'currentRev', label: 'Part Rev' }
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="text-left px-4 py-3 cursor-pointer hover:bg-slate-200 transition-colors font-medium text-sm text-slate-700"
                  onClick={() =>
                    key === sortKey 
                      ? updateState({ sortAsc: !sortAsc }) 
                      : updateState({ sortKey: key as keyof Product })
                  }
                >
                  {label}
                  {sortKey === key && (
                    <span className="ml-1">{sortAsc ? '▲' : '▼'}</span>
                  )}
                </th>
              ))}
              <th className="text-left px-4 py-3 font-medium text-sm text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((product) => (
              <tr key={product.id} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-sm font-semibold">{product.apcPN}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {product.item_type_name || 'Unknown'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{product.customer || '-'}</td>
                <td className="px-4 py-3 text-sm font-mono max-w-xs truncate">{product.customerPN || '-'}</td>
                <td className="px-4 py-3 text-sm">{product.currentRev || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onView(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="View Product"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => onEdit(product)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Edit Product"
                    >
                      <Pencil size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-slate-500">
          Showing {paginated.length} of {filtered.length} products
          {typeFilter && typeFilter !== 'all' && ` (filtered by ${typeFilter})`}
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => updateState({ page: Math.max(0, page - 1) })}
            disabled={page === 0}
            className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            const pageNum = page < 3 ? i : page - 2 + i
            if (pageNum >= totalPages) return null
            return (
              <button
                key={pageNum}
                onClick={() => updateState({ page: pageNum })}
                className={`px-3 py-1 rounded text-sm ${
                  pageNum === page
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-200 hover:bg-slate-300'
                }`}
              >
                {pageNum + 1}
              </button>
            )
          })}
          <button
            onClick={() => updateState({ page: Math.min(totalPages - 1, page + 1) })}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export type { TableState }