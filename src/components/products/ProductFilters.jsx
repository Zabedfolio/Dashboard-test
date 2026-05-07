'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

export function ProductFilters({ onFilterChange, categories = [] }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [categoryId, setCategoryId] = useState('all')

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ search, status, category_id: categoryId })
    }, 300)
    return () => clearTimeout(timer)
  }, [search, status, categoryId, onFilterChange])

  const statusOptions = ['All', 'Active', 'Inactive', 'Out of Stock', 'Low Stock']

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/30 p-4 rounded-xl border border-border/40">
      <div className="flex flex-wrap items-center gap-2">
        {statusOptions.map((opt) => (
          <Button
            key={opt}
            variant={status === opt ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setStatus(opt)}
            className="h-8 rounded-full px-4 text-xs"
          >
            {opt}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative flex-1 md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-9 h-9 bg-background/50 border-border/40"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-[180px] h-9 bg-background/50 border-border/40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
