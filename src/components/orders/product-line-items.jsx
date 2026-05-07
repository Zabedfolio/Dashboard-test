'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Trash2, ShoppingCart, Tag, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { formatOrderAmount } from '@/lib/orders-utils'

export function ProductLineItems({ items = [], onItemsChange }) {
  const [items_, setItems] = useState(items)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

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
      console.error('Search error:', error)
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
      unit_price: product.unit_price || 0,
      discount: 0,
      subtotal: product.unit_price || 0,
      variants: product.variants || [], // Store product variants for selection
      selected_variant: null
    }

    const updatedItems = [...items_, newItem]
    setItems(updatedItems)
    onItemsChange(updatedItems)
    setSearchQuery('')
    setSearchResults([])
    toast.success(`${product.name} added`)
  }

  const updateItem = (id, field, value) => {
    const updatedItems = items_.map((item) => {
      if (item.id === id) {
        const updated = { ...item }

        if (field === 'qty' || field === 'unit_price' || field === 'discount') {
          updated[field] = Number(value) || 0
        } else if (field === 'variant') {
          const v = item.variants.find(v => v.label === value)
          updated.selected_variant = value
          if (v) updated.unit_price = v.price // Auto-set price from variant, user can still edit
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
    <div className="space-y-6">
      {/* Product Search */}
      <div className="relative group">
        <Label htmlFor="product-search" className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
          Search & Add Products
        </Label>
        <div className="relative">
          <Input
            id="product-search"
            placeholder="Type product name (e.g. Ghee)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              handleSearch(e.target.value)
            }}
            className="h-12 pl-10 bg-muted/30 border-border/40 focus:ring-primary/20"
            autoComplete="off"
          />
          <ShoppingCart className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground opacity-50" />
        </div>

        {searchQuery.length > 0 && (
          <div className="absolute z-50 w-full mt-2 max-h-[400px] overflow-y-auto bg-card border border-border/40 rounded-xl shadow-2xl backdrop-blur-xl">
            {isSearching ? (
              <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">Searching inventory...</div>
            ) : searchResults.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No products found for "<span className="text-foreground font-bold">{searchQuery}</span>"
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addItem(product)}
                    className="flex justify-between items-center w-full px-4 py-3 hover:bg-primary/10 cursor-pointer rounded-lg transition-all group/item"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-sm group-hover/item:text-primary transition-colors">{product.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{product.sku}</span>
                        <span className="text-[10px] font-bold text-primary">{formatOrderAmount(product.unit_price)}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full p-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Items List */}
      <div className="space-y-4">
        {items_.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-2xl bg-muted/5">
            <ShoppingCart className="w-8 h-8 text-muted-foreground opacity-20 mb-2" />
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Order is empty</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items_.map((item) => (
              <Card key={item.id} className="overflow-hidden border-border/40 bg-card/40 backdrop-blur-sm group">
                <div className="p-4 space-y-4">
                  {/* Item Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Tag className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase">{item.product_id.substring(0, 8)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Quantity & Variant Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.variants && item.variants.length > 0 && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-primary">Weight / Quantity Variant</Label>
                        <Select 
                          onValueChange={(val) => updateItem(item.id, 'variant', val)}
                          defaultValue={item.selected_variant}
                        >
                          <SelectTrigger className="h-9 bg-background/50">
                            <SelectValue placeholder="Select Quantity (e.g. 250gm, 1kg)" />
                          </SelectTrigger>
                          <SelectContent>
                            {item.variants.map((v, i) => (
                              <SelectItem key={i} value={v.label}>
                                {v.label} — {formatOrderAmount(v.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quantity (Packs/Units)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                        className="h-9 bg-background/50"
                      />
                    </div>
                  </div>

                  {/* Pricing Row */}
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/40">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Unit Price (৳)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                        className="h-8 bg-background/50 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Discount (৳)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                        className="h-8 bg-background/50 text-xs"
                      />
                    </div>
                    <div className="text-right flex flex-col justify-end">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Subtotal</span>
                      <span className="text-sm font-black text-primary">
                        {formatOrderAmount(item.subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
