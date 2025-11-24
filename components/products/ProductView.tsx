'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Tabs from '@/components/ui/Tabs'

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
  item_type_code?: string | null
  item_type_id: number
  createdAt: string
}

type ProductionData = {
  [key: string]: any
}

type Props = {
  product: Product
  onClose: () => void
}

export default function ProductView({ product, onClose }: Props) {
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

  const infoClassName = "w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-sm"

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
            value={product.apcPN}
            readOnly
            className={infoClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Type
          </label>
          <input
            type="text"
            value={product.item_type_name || 'Unknown'}
            readOnly
            className={infoClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Customer Part Number
          </label>
          <input
            type="text"
            value={product.customerPN || '-'}
            readOnly
            className={infoClassName}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Customer
          </label>
          <input
            type="text"
            value={product.customer || '-'}
            readOnly
            className={infoClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Part Revision
          </label>
          <input
            type="text"
            value={product.currentRev || '-'}
            readOnly
            className={infoClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Build Revision
          </label>
          <input
            type="text"
            value={product.buildRev || '-'}
            readOnly
            className={infoClassName}
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            value={product.description || '-'}
            readOnly
            rows={3}
            className={infoClassName}
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Full Path
          </label>
          <input
            type="text"
            value={product.fullPath || '-'}
            readOnly
            className={infoClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Created At
          </label>
          <input
            type="text"
            value={new Date(product.createdAt).toLocaleString()}
            readOnly
            className={infoClassName}
          />
        </div>
      </div>
    </div>
  )

  // Production Information Tab
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
          No production data found for part {product.apcPN}
        </div>
      )}

      {!loadingProduction && !productionError && productionData.length > 0 && (
        <div>
          <div className="mb-4">
            <h4 className="font-semibold text-slate-800">
              Production Records ({productionData.length})
            </h4>
            <p className="text-sm text-slate-600">
              Data from data0050 table
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">View Product: {product.apcPN}</h2>
            <p className="text-sm text-slate-600 mt-1">Product information (read-only)</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Content with Tabs */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}