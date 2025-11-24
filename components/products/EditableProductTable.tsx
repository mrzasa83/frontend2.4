'use client'

import { useState } from 'react'
import { Eye, Save, X, Edit2 } from 'lucide-react'

type Product = {
  id: number
  apcPN: string
  customer: string | null
  customerPN: string | null
  buildRev: string | null
  currentRev: string | null
  description: string | null
  fullPath: string | null
  item_type_name: string | null
  item_type_id: number
  createdAt: string
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
  onSave: (product: Product) => Promise<void>
  tableState: TableState
  onTableStateChange: (state: TableState) => void
  isAdmin: boolean
}

export default function EditableProductTable({ 
  products, 
  onView, 
  onEdit, 
  onSave,
  tableState, 
  onTableStateChange,
  isAdmin 
}: Props) {
  const { search, sortKey, sortAsc, pageSize, page, typeFilter } = tableState
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [editedData, setEditedData] = useState<Partial<Product>>({})
  const [saving, setSaving] = useState(false)

  const updateState = (updates: Partial<TableState>) => {
    onTableStateChange({ ...tableState, ...updates })
  }

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

  const handleStartEdit = (product: Product) => {
    setEditingRow(product.id)
    setEditedData({
      customer: product.customer,
      customerPN: product.customerPN,
      currentRev: product.currentRev,
      description: product.description
    })
  }

  const handleCancelEdit = () => {
    setEditingRow(null)
    setEditedData({})
  }

  const handleSaveEdit = async (product: Product) => {
    setSaving(true)
    try {
      await onSave({
        ...product,
        ...editedData
      })
      setEditingRow(null)
      setEditedData({})
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleFieldChange = (field: keyof Product, value: string) => {
    setEditedData(prev => ({ ...prev, [field]: value }))
  }

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
              <th className="text-left px-4 py-3 font-medium text-sm text-slate-700 cursor-pointer hover:bg-slate-200"
                  onClick={() => sortKey === 'apcPN' ? updateState({ sortAsc: !sortAsc }) : updateState({ sortKey: 'apcPN' })}>
                Part Number {sortKey === 'apcPN' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="text-left px-4 py-3 font-medium text-sm text-slate-700 cursor-pointer hover:bg-slate-200"
                  onClick={() => sortKey === 'item_type_name' ? updateState({ sortAsc: !sortAsc }) : updateState({ sortKey: 'item_type_name' })}>
                Type {sortKey === 'item_type_name' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="text-left px-4 py-3 font-medium text-sm text-slate-700 cursor-pointer hover:bg-slate-200"
                  onClick={() => sortKey === 'customer' ? updateState({ sortAsc: !sortAsc }) : updateState({ sortKey: 'customer' })}>
                Customer {sortKey === 'customer' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="text-left px-4 py-3 font-medium text-sm text-slate-700 cursor-pointer hover:bg-slate-200"
                  onClick={() => sortKey === 'customerPN' ? updateState({ sortAsc: !sortAsc }) : updateState({ sortKey: 'customerPN' })}>
                Customer PN {sortKey === 'customerPN' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="text-left px-4 py-3 font-medium text-sm text-slate-700 cursor-pointer hover:bg-slate-200"
                  onClick={() => sortKey === 'currentRev' ? updateState({ sortAsc: !sortAsc }) : updateState({ sortKey: 'currentRev' })}>
                Part Rev {sortKey === 'currentRev' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="text-left px-4 py-3 font-medium text-sm text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((product) => {
              const isEditing = editingRow === product.id
              
              return (
                <tr key={product.id} className={`border-t border-slate-200 ${isEditing ? 'bg-blue-50' : 'hover:bg-slate-50'} transition-colors`}>
                  <td className="px-4 py-3 font-mono text-sm font-semibold">{product.apcPN}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {product.item_type_name || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.customer ?? product.customer ?? ''}
                        onChange={(e) => handleFieldChange('customer', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      product.customer || '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.customerPN ?? product.customerPN ?? ''}
                        onChange={(e) => handleFieldChange('customerPN', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <span className="font-mono">{product.customerPN || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.currentRev ?? product.currentRev ?? ''}
                        onChange={(e) => handleFieldChange('currentRev', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      product.currentRev || '-'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(product)}
                          disabled={saving}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                          title="Save Changes"
                        >
                          <Save size={18} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Cancel"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onView(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Product"
                        >
                          <Eye size={18} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleStartEdit(product)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            title="Quick Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(product)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Full Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
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