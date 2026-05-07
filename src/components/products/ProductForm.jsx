'use client'

import { useForm, useFieldArray } from 'react-hook-form'
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { ImageUploader } from './ImageUploader'
import { useState, useMemo } from 'react'
import { Plus, Trash2, Tag, Scale, Package } from 'lucide-react'
import { toast } from 'sonner'
import { createCategory } from '@/lib/categories'

const variantSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  weight_kg: z.number().min(0, 'Weight must be non-negative'),
  price: z.number().min(0, 'Price must be positive')
})

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),
  unit: z.enum(['pcs', 'kg', 'litre', 'box', 'dozen']),
  unit_price: z.number().min(0, 'Price must be positive'),
  purchase_price: z.number().min(0, 'Purchase price must be positive').optional(),
  discount: z.number().min(0, 'Discount must be positive').default(0),
  stock: z.number().min(0, 'Stock cannot be negative').default(0),
  low_stock_threshold: z.number().min(1, 'Threshold must be at least 1').default(5),
  status: z.enum(['Active', 'Inactive', 'Out of Stock']),
  images: z.array(z.string()).default([]),
  variants: z.array(variantSchema).default([])
})

export function ProductForm({ 
  initialData = null, 
  categories = [], 
  onSubmit, 
  isLoading, 
  isAdmin,
  onRefreshCategories 
}) {
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [isCreatingCat, setIsCreatingCat] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
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
      images: initialData?.images || [],
      variants: initialData?.variants || []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants"
  })

  const images = watch('images')
  const unit = watch('unit')
  const totalStock = watch('stock')
  const variants = watch('variants')

  // Calculate unit breakdown for display
  const stockBreakdown = useMemo(() => {
    if ((unit !== 'kg' && unit !== 'litre') || !variants.length) return null
    return variants.map(v => ({
      label: v.label,
      units: Math.floor(totalStock / (v.weight_kg || 1))
    }))
  }, [totalStock, unit, variants])

  const handleQuickCategory = async () => {
    if (!newCatName) return
    setIsCreatingCat(true)
    try {
      const newCat = await createCategory({ name: newCatName })
      toast.success('Category created')
      if (onRefreshCategories) await onRefreshCategories()
      setValue('category_id', newCat.id)
      setIsCatDialogOpen(false)
      setNewCatName('')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsCreatingCat(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 bg-card/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Basic Information</CardTitle>
              <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" type="button" className="h-8 text-[10px] font-bold uppercase tracking-wider">
                    <Plus className="w-3 h-3 mr-1" /> Quick Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                    <DialogDescription>
                      Create a new category to organize your products.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Category Name</Label>
                      <Input 
                        value={newCatName} 
                        onChange={(e) => setNewCatName(e.target.value)} 
                        placeholder="e.g. Dairy Products"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsCatDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleQuickCategory} disabled={isCreatingCat}>
                      {isCreatingCat ? 'Creating...' : 'Create Category'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input 
                  id="name" 
                  {...register('name')} 
                  placeholder="e.g. Premium Ghee"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select 
                    value={watch('category_id')}
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
                  rows={3}
                  placeholder="Detailed product description..."
                />
              </div>

              <div className="space-y-2">
                <Label>Product Status</Label>
                <RadioGroup 
                  value={watch('status')}
                  onValueChange={(val) => setValue('status', val)}
                  className="flex gap-4 mt-2"
                >
                  {['Active', 'Inactive', 'Out of Stock'].map((s) => (
                    <div key={s} className="flex items-center space-x-2">
                      <RadioGroupItem value={s} id={s} />
                      <Label htmlFor={s} className="font-normal cursor-pointer text-xs">{s}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Variants Section */}
          <Card className="border-border/40 bg-card/20 border-dashed border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  QUANTITY VARIANTS & PRICING
                </CardTitle>
                <p className="text-[10px] text-muted-foreground mt-1">Add different sizes (250gm, 1kg) and their specific prices.</p>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => append({ label: '', weight_kg: 0, price: 0 })}
              >
                <Plus className="w-3 h-3 mr-1" /> Add Variant
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-muted/20 rounded-lg border border-border/40 animate-in fade-in zoom-in-95">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold">LABEL (e.g. 250gm)</Label>
                    <Input {...register(`variants.${index}.label`)} placeholder="250gm" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold">WEIGHT/VOL (KG/L)</Label>
                    <Input 
                      type="number" 
                      step="0.001" 
                      {...register(`variants.${index}.weight_kg`, { valueAsNumber: true })} 
                      placeholder="0.25"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold">PRICE (৳)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...register(`variants.${index}.price`, { valueAsNumber: true })} 
                      placeholder="৳"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="flex items-end justify-end">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-red-500 hover:bg-red-500/10"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {fields.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground italic">
                  No variants added. Product will use the base price and unit.
                </div>
              )}
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
              <CardTitle>Global Pricing & Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Base Unit Type *</Label>
                <Select 
                  value={watch('unit')}
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
                <Label htmlFor="stock">Total Available Stock ({unit}) *</Label>
                <div className="relative">
                  <Input 
                    id="stock" 
                    type="number" 
                    step="0.01"
                    {...register('stock', { valueAsNumber: true })} 
                  />
                  <Package className="absolute right-3 top-3 w-4 h-4 text-muted-foreground opacity-50" />
                </div>
                <p className="text-[10px] text-muted-foreground italic mt-1">Stock is tracked in the base unit (e.g. total KG).</p>
              </div>

              {/* Real-time Breakdown */}
              {stockBreakdown && (
                <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/20 space-y-2">
                  <Label className="text-[10px] font-bold text-indigo-400 flex items-center gap-1 uppercase tracking-wider">
                    <Scale className="w-3 h-3" /> Equivalent Units Available
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {stockBreakdown.map((b, i) => (
                      <div key={i} className="flex flex-col bg-card/40 p-2 rounded-lg border border-indigo-500/10">
                        <span className="text-[9px] text-muted-foreground uppercase font-bold">{b.label}</span>
                        <span className="text-sm font-black">{b.units} <span className="text-[10px] font-normal text-muted-foreground">packs</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <Label htmlFor="unit_price">Base Selling Price (৳) *</Label>
                <Input 
                  id="unit_price" 
                  type="number" 
                  step="0.01"
                  {...register('unit_price', { valueAsNumber: true })} 
                />
                <p className="text-[9px] text-muted-foreground">Fallback price if no variants are selected.</p>
              </div>

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
                <Label htmlFor="discount">Discount (৳)</Label>
                <Input 
                  id="discount" 
                  type="number" 
                  step="0.01"
                  {...register('discount', { valueAsNumber: true })} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="low_stock_threshold">Low Stock Alert ({unit})</Label>
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
            className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : (initialData ? 'Update Product' : 'Create Product')}
          </Button>
        </div>
      </div>
    </form>
  )
}
