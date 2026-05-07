'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Loader2, 
  Settings, 
  History, 
  PackageCheck, 
  AlertTriangle,
  RefreshCw,
  Copy,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductForm } from '@/components/products/ProductForm'
import { StockAdjustmentModal } from '@/components/products/StockAdjustmentModal'
import { StockMovementHistory } from '@/components/products/StockMovementHistory'
import { StatusBadge } from '@/components/products/StatusBadge'
import { getProductById, updateProduct, deleteProduct, duplicateProduct } from '@/lib/products'
import { getCategories } from '@/lib/categories'
import { toast } from 'sonner'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'

export default function ProductDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [product, setProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [prodData, catData] = await Promise.all([
        getProductById(id),
        getCategories()
      ])
      setProduct(prodData)
      setCategories(catData)
    } catch (error) {
      toast.error('Failed to load product data')
      router.push('/dashboard/products')
    } finally {
      setIsLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpdate = async (data) => {
    setIsUpdating(true)
    try {
      await updateProduct(id, data)
      toast.success('Product updated successfully')
      fetchData()
    } catch (error) {
      toast.error('Update failed')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Permanently delete this product?')) return
    try {
      await deleteProduct(id)
      toast.success('Product deleted')
      router.push('/dashboard/products')
    } catch (error) {
      toast.error('Delete failed')
    }
  }

  const handleDuplicate = async () => {
    try {
      const newProd = await duplicateProduct(id)
      toast.success('Duplicated successfully')
      router.push(`/dashboard/products/${newProd.id}`)
    } catch (error) {
      toast.error('Duplicate failed')
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const isLowStock = product.stock < product.low_stock_threshold && product.stock > 0

  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="rounded-full h-10 w-10 border-border/40" asChild>
            <Link href="/dashboard/products">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <StatusBadge 
                status={product.status} 
                stock={product.stock} 
                threshold={product.low_stock_threshold} 
              />
            </div>
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">
              {product.sku} • {product.categories?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDuplicate} className="border-border/40">
            <Copy className="w-4 h-4 mr-2" /> Duplicate
          </Button>
          {isAdmin && (
            <Button variant="destructive" onClick={handleDelete} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-red-500/20">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-2">
          <ProductForm 
            initialData={product}
            categories={categories}
            onSubmit={handleUpdate}
            isLoading={isUpdating}
            isAdmin={isAdmin}
          />
        </div>

        {/* Right: Stock & History */}
        <div className="space-y-6">
          <Card className="border-border/40 bg-card/40 overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-primary" />
                STOCK OVERVIEW
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="relative inline-block">
                <p className="text-6xl font-black tracking-tighter">{product.stock}</p>
                <span className="text-xs text-muted-foreground uppercase absolute -right-8 bottom-2">{product.unit}</span>
              </div>
              
              {isLowStock && (
                <div className="bg-yellow-500/10 text-yellow-500 p-3 rounded-xl border border-yellow-500/20 flex items-center gap-3 text-left">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-[11px] leading-tight font-medium">
                    This product is below its low stock threshold ({product.low_stock_threshold}). Restock recommended.
                  </p>
                </div>
              )}

              <Button className="w-full h-11" onClick={() => setIsAdjModalOpen(true)}>
                <RefreshCw className="w-4 h-4 mr-2" /> Adjust Stock
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/20">
            <CardHeader className="pb-3 border-b border-border/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                MOVEMENT HISTORY
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <StockMovementHistory productId={id} />
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-indigo-500/5 border-dashed">
            <CardContent className="p-6 text-center space-y-2">
              <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Related Orders</p>
              <p className="text-[10px] text-muted-foreground italic">Integration with Orders module coming soon.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <StockAdjustmentModal 
        isOpen={isAdjModalOpen}
        onClose={() => setIsAdjModalOpen(false)}
        product={product}
        onSuccess={fetchData}
      />
    </div>
  )
}
