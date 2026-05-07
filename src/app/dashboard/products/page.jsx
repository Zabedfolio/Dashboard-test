'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, LayoutGrid, List, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatsBar } from '@/components/products/StatsBar'
import { ProductFilters } from '@/components/products/ProductFilters'
import { ProductsTable } from '@/components/products/ProductsTable'
import { ProductsGrid } from '@/components/products/ProductsGrid'
import { 
  getProducts, 
  getProductStats, 
  deleteProduct, 
  duplicateProduct, 
  exportProductsCSV,
  bulkUpdateStatus,
  bulkDeleteProducts
} from '@/lib/products'
import { getCategories } from '@/lib/categories'
import { toast } from 'sonner'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth' // Assuming you have an auth hook

export default function ProductsPage() {
  const { user, profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  
  const [view, setView] = useState('table')
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState(null)
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState([])
  
  // Filters state
  const [filters, setFilters] = useState({
    status: 'All',
    category_id: 'all',
    search: '',
    page: 1
  })
  const [pagination, setPagination] = useState({ totalPages: 1, count: 0 })

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [prodResult, statsResult, catResult] = await Promise.all([
        getProducts(filters),
        getProductStats(),
        getCategories()
      ])
      
      setProducts(prodResult.data)
      setPagination({ totalPages: prodResult.totalPages, count: prodResult.count })
      setStats(statsResult)
      setCategories(catResult)
    } catch (error) {
      toast.error('Failed to load products')
      console.error('Data fetch error:', error.message, error.details || error)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await deleteProduct(id)
      toast.success('Product deleted')
      fetchData()
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }

  const handleDuplicate = async (id) => {
    try {
      await duplicateProduct(id)
      toast.success('Product duplicated as Inactive')
      fetchData()
    } catch (error) {
      toast.error('Failed to duplicate product')
    }
  }

  const handleExport = async () => {
    try {
      const data = await exportProductsCSV(filters)
      const csvContent = "data:text/csv;charset=utf-8," 
        + [Object.keys(data[0]).join(","), ...data.map(row => Object.values(row).join(","))].join("\n")
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      toast.error('Export failed')
    }
  }

  const handleBulkStatus = async (status) => {
    try {
      await bulkUpdateStatus(selectedIds, status)
      toast.success(`Updated ${selectedIds.length} products to ${status}`)
      setSelectedIds([])
      fetchData()
    } catch (error) {
      toast.error('Bulk update failed')
    }
  }

  const handleFilterChange = useCallback((f) => {
    setFilters(prev => ({ ...prev, ...f, page: 1 }))
  }, [])

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your inventory, pricing, and stock levels.</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={handleExport} className="border-border/40">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          )}
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
            <Link href="/dashboard/products/new">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Filters & View Toggle */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <ProductFilters 
              categories={categories} 
              onFilterChange={handleFilterChange} 
            />
          </div>
          <div className="flex items-center gap-2 ml-4 bg-muted/50 p-1 rounded-lg border border-border/40">
            <Button 
              variant={view === 'table' ? 'secondary' : 'ghost'} 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setView('table')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button 
              variant={view === 'grid' ? 'secondary' : 'ghost'} 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl animate-in fade-in slide-in-from-top-2">
            <div className="text-sm font-medium text-indigo-400 ml-2">
              {selectedIds.length} products selected
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleBulkStatus('Active')} className="h-8 text-xs">Set Active</Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatus('Inactive')} className="h-8 text-xs">Set Inactive</Button>
              {isAdmin && (
                <Button size="sm" variant="destructive" onClick={() => bulkDeleteProducts(selectedIds)} className="h-8 text-xs">Delete</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])} className="h-8 text-xs">Cancel</Button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="animate-pulse">Loading inventory...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {view === 'table' ? (
            <ProductsTable 
              products={products}
              selectedIds={selectedIds}
              onSelectChange={setSelectedIds}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              isAdmin={isAdmin}
            />
          ) : (
            <ProductsGrid 
              products={products}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              isAdmin={isAdmin}
            />
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{(filters.page - 1) * 20 + 1}</span> to <span className="font-medium text-foreground">{Math.min(filters.page * 20, pagination.count)}</span> of <span className="font-medium text-foreground">{pagination.count}</span> products
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={filters.page === 1}
                  onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={filters.page === pagination.totalPages}
                  onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
