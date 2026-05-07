'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductForm } from '@/components/products/ProductForm'
import { createProduct } from '@/lib/products'
import { getCategories } from '@/lib/categories'
import { toast } from 'sonner'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'

export default function NewProductPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingCats, setIsFetchingCats] = useState(true)

  useEffect(() => {
    async function loadCats() {
      try {
        const data = await getCategories()
        setCategories(data)
      } catch (error) {
        toast.error('Failed to load categories')
      } finally {
        setIsFetchingCats(false)
      }
    }
    loadCats()
  }, [])

  const handleSubmit = async (data) => {
    setIsLoading(true)
    try {
      const product = await createProduct(data)
      toast.success('Product created successfully')
      router.push(`/dashboard/products/${product.id}`)
    } catch (error) {
      toast.error(error.message || 'Failed to create product')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetchingCats) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/products">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Product</h1>
          <p className="text-sm text-muted-foreground">Create a new item in your product catalog.</p>
        </div>
      </div>

      <ProductForm 
        categories={categories}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        isAdmin={profile?.role === 'admin'}
      />
    </div>
  )
}
