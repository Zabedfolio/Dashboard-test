'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { toast } from 'sonner'
import { CustomerLookup } from './customer-lookup'
import { ProductLineItems } from './product-line-items'
import { OrderSummary } from './order-summary'
import { calculateOrderTotal } from '@/lib/orders-utils'

const orderSchema = z.object({
  customer_id: z.string().optional(),
  customer_name: z.string().min(1, 'Customer name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  full_address: z.string().min(1, 'Address is required'),
  items: z.array(z.any()).min(1, 'At least one item is required'),
  total_amount: z.number().min(0.01, 'Total must be greater than 0'),
  shipping_charge: z.number().min(0),
  delivery_method: z.enum(['Inside Dhaka', 'Outside Dhaka', 'Pickup']),
  payment_method: z.enum(['COD', 'bKash', 'Nagad', 'Bank Transfer', 'Paid']),
  payment_status: z.enum(['Unpaid', 'Partial', 'Paid']),
  notes: z.string().optional()
})

export function OrderForm({ mode = 'create', initialOrder = null, onSuccess }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState(initialOrder?.items || [])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_id: initialOrder?.customer_id || '',
      customer_name: initialOrder?.customers?.name || '',
      phone: initialOrder?.customers?.phone || '',
      email: initialOrder?.customers?.email || '',
      full_address: initialOrder?.customers?.full_address || '',
      items: initialOrder?.items || [],
      total_amount: initialOrder?.total_amount || 0,
      shipping_charge: initialOrder?.shipping_charge || 0,
      delivery_method: initialOrder?.delivery_method || 'Inside Dhaka',
      payment_method: initialOrder?.payment_method || 'COD',
      payment_status: initialOrder?.payment_status || 'Unpaid',
      notes: initialOrder?.notes || ''
    }
  })

  const shippingCharge = watch('shipping_charge')

  // Keep form values in sync with the items state
  useEffect(() => {
    const total = calculateOrderTotal(items, shippingCharge)
    setValue('total_amount', total)
    setValue('items', items, { shouldValidate: items.length > 0 })
  }, [items, shippingCharge, setValue])

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, items })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to save order')

      toast.success('Order created successfully')
      router.push(`/dashboard/orders/${result.data.id}`)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCustomerSelect = (customer) => {
    if (customer) {
      setValue('customer_id', customer.id)
      setValue('customer_name', customer.name)
      setValue('phone', customer.phone)
      setValue('email', customer.email || '')
      setValue('full_address', customer.full_address || '')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40">
              <CardTitle className="text-lg font-black uppercase tracking-tighter">1. Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <CustomerLookup onCustomerSelect={handleCustomerSelect} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Name</Label>
                  <Input {...register('customer_name')} placeholder="Full Name" className="bg-muted/20" />
                  {errors.customer_name && <p className="text-[10px] font-bold text-destructive uppercase">{errors.customer_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Phone Number</Label>
                  <Input {...register('phone')} placeholder="01XXX-XXXXXX" className="bg-muted/20" />
                  {errors.phone && <p className="text-[10px] font-bold text-destructive uppercase">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Delivery Address</Label>
                <Textarea {...register('full_address')} placeholder="Full delivery address..." rows={3} className="bg-muted/20 resize-none" />
                {errors.full_address && <p className="text-[10px] font-bold text-destructive uppercase">{errors.full_address.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40">
              <CardTitle className="text-lg font-black uppercase tracking-tighter">2. Product Selection</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ProductLineItems items={items} onItemsChange={setItems} />
              {errors.items && <p className="text-sm font-bold text-destructive mt-4 uppercase">⚠ {errors.items.message}</p>}
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40">
              <CardTitle className="text-lg font-black uppercase tracking-tighter">3. Payment & Delivery</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Delivery Method</Label>
                <RadioGroup defaultValue="Inside Dhaka" onValueChange={(v) => setValue('delivery_method', v)} className="flex flex-col gap-3">
                  {['Inside Dhaka', 'Outside Dhaka', 'Pickup'].map((m) => (
                    <div key={m} className="flex items-center space-x-3 p-3 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer">
                      <RadioGroupItem value={m} id={m} />
                      <Label htmlFor={m} className="flex-1 cursor-pointer font-bold text-sm">{m}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Shipping Charge (৳)</Label>
                  <Input type="number" {...register('shipping_charge', { valueAsNumber: true })} className="bg-muted/20 font-black" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Payment Method</Label>
                  <Select onValueChange={(v) => setValue('payment_method', v)} defaultValue="COD">
                    <SelectTrigger className="bg-muted/20 font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['COD', 'bKash', 'Nagad', 'Bank Transfer', 'Paid'].map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* STICKY SIDEBAR */}
        <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-6">
          <OrderSummary items={items} shippingCharge={shippingCharge} />
          
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {isLoading ? 'Processing...' : 'Place Order Now'}
          </Button>

          <Card className="border-border/40 bg-muted/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[10px] leading-relaxed text-muted-foreground font-medium uppercase tracking-wider">
                  Order will be created as "Pending" and can be confirmed by the inventory team after stock verification.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
