'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Command, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { formatOrderAmount } from '@/lib/orders-utils'

export function ProductLineItems({ items = [], onItemsChange }) {
  const [items_, setItems] = useState(items)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [openPopover, setOpenPopover] = useState(null)

  const handleSearch = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`)
      const result = await response.json()

      if (response.ok) {
        setSearchResults(result.data || [])
      }
    } catch (error) {
      toast.error('Failed to search products')
    } finally {
      setIsSearching(false)
    }
  }, [])

  const addItem = (product) => {
    const newItem = {
      id: `item-${Date.now()}`,
      product_id: product.id,
      name: product.name,
      qty: 1,
      unit_price: 0, // Default to 0 for manual entry
      discount: 0,
      subtotal: 0
    }

    const updatedItems = [...items_, newItem]
    setItems(updatedItems)
    onItemsChange(updatedItems)
    setSearchQuery('')
    setSearchResults([])
    setOpenPopover(null)
    toast.success(`${product.name} added to order`)
  }

  const updateItem = (id, field, value) => {
    const updatedItems = items_.map((item) => {
      if (item.id === id) {
        const updated = { ...item }

        if (field === 'qty' || field === 'unit_price' || field === 'discount') {
          updated[field] = Number(value) || 0
        } else {
          updated[field] = value
        }

        // Recalculate subtotal
        const subtotal = (updated.unit_price * updated.qty) - updated.discount
        updated.subtotal = Math.max(0, subtotal)

        return updated
      }
      return item
    })

    setItems(updatedItems)
    onItemsChange(updatedItems)
  }

  const removeItem = (id) => {
    const updatedItems = items_.filter((item) => item.id !== id)
    setItems(updatedItems)
    onItemsChange(updatedItems)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Label htmlFor="product-search">Search Products</Label>
        <Input
          id="product-search"
          placeholder="Search by name or SKU..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            handleSearch(e.target.value)
          }}
          className="mt-1.5"
          autoComplete="off"
        />

        {searchQuery.length > 0 && (
          <div className="absolute z-50 w-full mt-1 max-h-[300px] overflow-y-auto bg-popover border rounded-md shadow-lg">
            {isSearching ? (
              <div className="p-4 text-sm text-muted-foreground">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No products found for "{searchQuery}"
              </div>
            ) : (
              <div className="py-1">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      if (product.stock > 0) {
                        addItem(product)
                        setSearchQuery('')
                      } else {
                        toast.error(`${product.name} is out of stock`)
                      }
                    }}
                    className={`flex justify-between items-center w-full px-4 py-2 hover:bg-accent cursor-pointer transition-colors border-b last:border-0 ${product.stock <= 0 ? 'opacity-50' : ''}`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        SKU: {product.sku} • {formatOrderAmount(product.unit_price)}
                      </span>
                    </div>
                    <div className="text-right">
                      {product.stock > 0 ? (
                        <span className="text-[10px] font-bold bg-green-500/10 text-green-500 px-2 py-1 rounded-full uppercase">
                          Stock: {product.stock}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-destructive/10 text-destructive px-2 py-1 rounded-full uppercase">
                          Stock Out
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {items_.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No products added yet. Search and add products above.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items_.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.product_id}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-2 text-sm">
                <div>
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                    className="h-8 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Unit Price (৳)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                    className="h-8 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Discount (৳)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.discount}
                    onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                    className="h-8 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Subtotal (৳)</Label>
                  <div className="h-8 flex items-center text-sm font-medium">
                    {formatOrderAmount(item.subtotal)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
