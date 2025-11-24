'use client'

import { useState, useEffect } from 'react'
import { Save, X } from 'lucide-react'
import Tabs from '@/components/ui/Tabs'

type Product = {
  id: number
  apcPN: string
  customer: string | null
  customerPN: string | null
  currentRev: string | null
  buildRev: string | null
  description: string | null
  fullPath: string | null
  item_type_name: string | null
  item_type_id: number
  createdAt: string
}

type ProductionData = {
  [key: string]: any
}

type Props = {
  product: Product
  onSave: (product: Product) => void
  onCancel: () => void
}

export default function ProductEditTabWithTabs({ product, onSave, onCancel }: Props) {
  const [formData, setFormData] = useState(product)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('base')
  const [productionData, setProductionData] = useState<ProductionData[]>([])
  const [loadingProduction, setLoadingProduction] = useState(false)
  const [productionError, setProductionError] = useState<string | null>(null)

  useEffect(() => {
    fetchProductionData()
  }, [product.apcPN])

  const fetchProductionData = async () => {
    setLoadingProduction(true)
    setProductionError(null)

    try {
      const res = await fetch('/api/products/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apcPN: product.apcPN })
      })

      if (!res.ok) {
        throw new Error('Failed to fetch production data')
      }

      const data = await res.json()
      setProductionData(data.results || [])
    } catch (error) {
      console.error('Error fetching production data:', error)
      setProductionError(error instanceof Error ? error.message : 'Failed to load production data')
    } finally {
      setLoadingProduction(false)
    }
  }

  const handleChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    onSave(formData)
    setHasChanges(false)
  }

  const inputClassName = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
  const readOnlyClassName = "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 cursor-not-allowed"

  // Base Information Tab
  const baseInfoTab = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            APC Part Number
          </label>
          <input
            type="text"
            value={formData.apcPN}
            readOnly
            className={readOnlyClassName}
            title="Part number cannot be changed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Type
          </label>
          <input
            type="text"
            value={formData.item_type_name || 'Unknown'}
            readOnly
            className={readOnlyClassName}
            title="Item type cannot be changed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Customer
          </label>
          <input
            type="text"
            value={formData.customer || ''}
            onChange={(e) => handleChange('customer', e.target.value)}
            className={inputClassName}
            placeholder="Enter customer name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Customer Part Number
          </label>
          <input
            type="text"
            value={formData.customerPN || ''}
            onChange={(e) => handleChange('customerPN', e.target.value)}
            className={inputClassName}
            placeholder="Enter customer part number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Part Revision
          </label>
          <input
            type="text"
            value={formData.currentRev || ''}
            onChange={(e) => handleChange('currentRev', e.target.value)}
            className={inputClassName}
            placeholder="e.g., A, B-1, Rev C"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Build Revision
          </label>
          <input
            type="text"
            value={formData.buildRev || ''}
            onChange={(e) => handleChange('buildRev', e.target.value)}
            className={inputClassName}
            placeholder="latest MCN ID"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className={inputClassName}
            placeholder="Enter product description (free-form)"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Full Path
          </label>
          <input
            type="text"
            value={formData.fullPath || ''}
            onChange={(e) => handleChange('fullPath', e.target.value)}
            className={inputClassName}
            placeholder="/mnt/jdrive/APC EngJobs/..."
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Base information is editable. Production data is read-only from external systems.
        </p>
      </div>
    </div>
  )

  // Production Information Tab (Read-only)
  const productionTab = (
    <div>
      {loadingProduction && (
        <div className="text-center py-8 text-slate-600">
          Loading production data...
        </div>
      )}

      {productionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="font-semibold">Error loading production data</p>
          <p className="text-sm">{productionError}</p>
        </div>
      )}

      {!loadingProduction && !productionError && productionData.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No production data found for part {formData.apcPN}
        </div>
      )}

      {!loadingProduction && !productionError && productionData.length > 0 && (
        <div>
          <div className="mb-4">
            <h4 className="font-semibold text-slate-800">
              Production Records ({productionData.length})
            </h4>
            <p className="text-sm text-slate-600">
              Data from data0050 table (read-only)
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  {productionData.length > 0 && Object.keys(productionData[0]).map((key, i) => (
                    <th key={i} className="px-4 py-2 text-left font-medium text-slate-700 whitespace-nowrap">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productionData.map((row, i) => (
                  <tr key={i} className="border-t border-slate-200 hover:bg-slate-50">
                    {Object.values(row).map((value, j) => (
                      <td key={j} className="px-4 py-2 whitespace-nowrap text-slate-600">
                        {value === null ? <span className="text-slate-400 italic">null</span> : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )

  const tabs = [
    { id: 'base', label: 'Base Information', content: baseInfoTab, closeable: false },
    { id: 'production', label: 'Production Information', content: productionTab, closeable: false }
  ]

  return (
    <div>
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Editing: {formData.apcPN}
          </h3>
          {hasChanges && (
            <p className="text-sm text-orange-600 mt-1">
              ⚠ You have unsaved changes
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <X size={18} />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}