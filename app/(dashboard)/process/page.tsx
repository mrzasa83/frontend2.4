'use client'

import { useState, useEffect } from 'react'
import Tabs from '@/components/ui/Tabs'
import EditableProductTable, { TableState } from '@/components/products/EditableProductTable'
import ProductView from '@/components/products/ProductView'
import ProductEditTab from '@/components/products/ProductEditTab'
import { Plus } from 'lucide-react'
import { useSession } from 'next-auth/react'

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

export default function ProductsPage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewProduct, setViewProduct] = useState<Product | null>(null)
  const [editingProducts, setEditingProducts] = useState<Product[]>([])
  const [activeTab, setActiveTab] = useState('all')
  
  const [tableState, setTableState] = useState<TableState>({
    search: '',
    sortKey: 'apcPN',
    sortAsc: true,
    pageSize: 25,
    page: 0,
    typeFilter: 'all'
  })

  // Check if user is admin
  const isAdmin = session?.user?.roles?.includes('admin') || false

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const res = await fetch('/api/products')
      
      if (!res.ok) {
        throw new Error(`Failed to fetch products: ${res.status}`)
      }
      
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
      setError(error instanceof Error ? error.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleView = (product: Product) => {
    setViewProduct(product)
  }

  const handleEdit = (product: Product) => {
    const alreadyEditing = editingProducts.find(p => p.id === product.id)
    if (!alreadyEditing) {
      setEditingProducts(prev => [...prev, product])
    }
    setActiveTab(`edit-${product.id}`)
  }

  const handleCloseEditTab = (productId: number) => {
    setEditingProducts(prev => prev.filter(p => p.id !== productId))
    setActiveTab('all')
  }

  const handleInlineSave = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })
      
      if (!res.ok) {
        const responseData = await res.json()
        throw new Error(responseData.error || 'Failed to save product')
      }
      
      await fetchProducts()
      
    } catch (error) {
      console.error('Error saving product:', error)
      alert(`Failed to save product: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw error
    }
  }

  const handleSave = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })
      
      if (!res.ok) {
        const responseData = await res.json()
        throw new Error(responseData.error || 'Failed to save product')
      }
      
      await fetchProducts()
      handleCloseEditTab(product.id)
      
    } catch (error) {
      console.error('Error saving product:', error)
      alert(`Failed to save product: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold">Error loading products</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={fetchProducts}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const productListTab = (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">
          All Products ({products.length})
        </h3>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus size={18} />
          Add Product
        </button>
      </div>
      <EditableProductTable 
        products={products} 
        onView={handleView} 
        onEdit={handleEdit}
        onSave={handleInlineSave}
        tableState={tableState}
        onTableStateChange={setTableState}
        isAdmin={isAdmin}
      />
    </div>
  )

  const tabs = [
    { 
      id: 'all', 
      label: 'All Products', 
      content: productListTab,
      closeable: false
    },
    ...editingProducts.map(product => ({
      id: `edit-${product.id}`,
      label: product.apcPN,
      content: (
        <ProductEditTab
          product={product}
          onSave={handleSave}
          onCancel={() => handleCloseEditTab(product.id)}
        />
      ),
      closeable: true,
      onClose: () => handleCloseEditTab(product.id)
    }))
  ]

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Products</h2>
      <p className="text-slate-600 mb-6">Manage product catalog and specifications</p>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {viewProduct && (
        <ProductView
          product={viewProduct}
          onClose={() => setViewProduct(null)}
        />
      )}
    </div>
  )
}