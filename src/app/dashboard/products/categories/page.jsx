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
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Button variant="outline" size="icon" className="rounded-full border-border/40 shrink-0 h-9 w-9 sm:h-10 sm:w-10" asChild>
            <Link href="/dashboard/products">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Categories</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Organize your products with categories.</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchCats} disabled={isLoading} className="self-end sm:self-auto h-9 w-9">
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
