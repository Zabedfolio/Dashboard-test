'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Tag, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryManager } from '@/components/products/CategoryManager'
import { getCategories } from '@/lib/categories'
import { toast } from 'sonner'
import Link from 'next/link'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchCats = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      toast.error('Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCats()
  }, [fetchCats])

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="rounded-full border-border/40" asChild>
            <Link href="/dashboard/products">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
            <p className="text-sm text-muted-foreground">Organize your products with nested categories.</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchCats} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <CategoryManager categories={categories} onRefresh={fetchCats} />
      )}
    </div>
  )
}
