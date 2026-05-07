'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUploader } from './ImageUploader'
import { useState } from 'react'

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),
  unit: z.enum(['pcs', 'kg', 'litre', 'box', 'dozen']),
  unit_price: z.number().min(0, 'Price must be positive'),
  purchase_price: z.number().min(0, 'Purchase price must be positive').optional(),
  discount: z.number().min(0, 'Discount must be positive').default(0),
  stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  low_stock_threshold: z.number().int().min(1, 'Threshold must be at least 1').default(5),
  status: z.enum(['Active', 'Inactive', 'Out of Stock']),
  images: z.array(z.string()).default([])
})

export function ProductForm({ 
  initialData = null, 
  categories = [], 
  onSubmit, 
  isLoading, 
  isAdmin 
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      category_id: initialData?.category_id || '',
      brand: initialData?.brand || '',
      unit: initialData?.unit || 'pcs',
      unit_price: initialData?.unit_price || 0,
      purchase_price: initialData?.purchase_price || 0,
      discount: initialData?.discount || 0,
      stock: initialData?.stock || 0,
      low_stock_threshold: initialData?.low_stock_threshold || 5,
      status: initialData?.status || 'Active',
      images: initialData?.images || []
    }
  })

  const images = watch('images')
  const sellingPrice = watch('unit_price')
  const discount = watch('discount')
  const effectivePrice = Math.max(0, sellingPrice - discount)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 bg-card/20">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input 
                  id="name" 
                  {...register('name')} 
                  placeholder="e.g. Organic Mustard Oil 1L"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select 
                    defaultValue={initialData?.category_id}
                    onValueChange={(val) => setValue('category_id', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category_id && <p className="text-xs text-red-500">{errors.category_id.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" {...register('brand')} placeholder="e.g. Hatkhola" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  {...register('description')} 
                  rows={4}
                  placeholder="Detailed product description..."
                />
              </div>

              <div className="space-y-2">
                <Label>Product Status</Label>
                <RadioGroup 
                  defaultValue={initialData?.status || 'Active'}
                  onValueChange={(val) => setValue('status', val)}
                  className="flex gap-4 mt-2"
                >
                  {['Active', 'Inactive', 'Out of Stock'].map((s) => (
                    <div key={s} className="flex items-center space-x-2">
                      <RadioGroupItem value={s} id={s} />
                      <Label htmlFor={s} className="font-normal cursor-pointer">{s}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/20">
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader 
                images={images} 
                onChange={(urls) => setValue('images', urls)} 
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Pricing & Inventory */}
        <div className="space-y-6">
          <Card className="border-border/40 bg-card/20">
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="purchase_price">Purchase Price (৳)</Label>
                  <Input 
                    id="purchase_price" 
                    type="number" 
                    step="0.01"
                    {...register('purchase_price', { valueAsNumber: true })} 
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="unit_price">Selling Price (৳) *</Label>
                <Input 
                  id="unit_price" 
                  type="number" 
                  step="0.01"
                  {...register('unit_price', { valueAsNumber: true })} 
                />
                {errors.unit_price && <p className="text-xs text-red-500">{errors.unit_price.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Discount (৳)</Label>
                <Input 
                  id="discount" 
                  type="number" 
                  step="0.01"
                  {...register('discount', { valueAsNumber: true })} 
                />
              </div>

              <div className="pt-4 border-t border-border/40">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Effective Price:</span>
                  <span className="font-bold text-lg">৳{effectivePrice.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/20">
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Unit Type *</Label>
                <Select 
                  defaultValue={initialData?.unit || 'pcs'}
                  onValueChange={(val) => setValue('unit', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['pcs', 'kg', 'litre', 'box', 'dozen'].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Opening Stock *</Label>
                <Input 
                  id="stock" 
                  type="number" 
                  {...register('stock', { valueAsNumber: true })} 
                  disabled={!!initialData} // Only set stock on creation
                />
                {initialData && <p className="text-[10px] text-muted-foreground italic">Stock can only be adjusted via stock management after creation.</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                <Input 
                  id="low_stock_threshold" 
                  type="number" 
                  {...register('low_stock_threshold', { valueAsNumber: true })} 
                />
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : (initialData ? 'Update Product' : 'Create Product')}
          </Button>
        </div>
      </div>
    </form>
  )
}
