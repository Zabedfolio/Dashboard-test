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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  items: z.array(z.object({
    id: z.string(),
    product_id: z.string(),
    name: z.string(),
    qty: z.number().min(1),
    unit_price: z.number().min(0),
    discount: z.number().min(0),
    subtotal: z.number().min(0)
  })).min(1, 'At least one item is required'),
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
  const [selectedCustomer, setSelectedCustomer] = useState(initialOrder?.customers || null)
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

  useEffect(() => {
    if (items.length > 0) {
      const total = calculateOrderTotal(items, shippingCharge)
      setValue('total_amount', total)
    }
  }, [items, shippingCharge, setValue])

  useEffect(() => {
    if (selectedCustomer) {
      setValue('customer_id', selectedCustomer.id)
      setValue('customer_name', selectedCustomer.name)
      setValue('phone', selectedCustomer.phone)
      setValue('email', selectedCustomer.email || '')
      setValue('full_address', selectedCustomer.full_address || '')
    }
  }, [selectedCustomer, setValue])

  const onSubmit = async (data) => {
    setIsLoading(true)

    try {
      const url = mode === 'create'
        ? '/api/orders'
        : `/api/orders/${initialOrder.id}`

      const method = mode === 'create' ? 'POST' : 'PATCH'

      const payload = {
        ...data,
        items,
        // Ensure we use the form values in case the user edited them
        phone: data.phone,
        customer_name: data.customer_name,
        email: data.email,
        full_address: data.full_address
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save order')
      }

      toast.success(mode === 'create' ? 'Order created successfully' : 'Order updated successfully')

      if (mode === 'create') {
        router.push(`/dashboard/orders/${result.data.id}`)
      } else {
        onSuccess?.()
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save order')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CustomerLookup
                onCustomerSelect={setSelectedCustomer}
                initialCustomer={selectedCustomer}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    {...register('customer_name')}
                    placeholder="Enter customer name"
                  />
                  {errors.customer_name && (
                    <p className="text-xs text-destructive">{errors.customer_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="customer@example.com"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_address">Full Address *</Label>
                <Textarea
                  id="full_address"
                  {...register('full_address')}
                  placeholder="Enter full delivery address"
                  rows={3}
                />
                {errors.full_address && (
                  <p className="text-xs text-destructive">{errors.full_address.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductLineItems items={items} onItemsChange={setItems} />
              {errors.items && (
                <p className="text-sm text-destructive mt-2">{errors.items.message}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Delivery Method *</Label>
                <RadioGroup
                  defaultValue={initialOrder?.delivery_method || 'Inside Dhaka'}
                  onValueChange={(value) => setValue('delivery_method', value)}
                  className="mt-2"
                >
                  {['Inside Dhaka', 'Outside Dhaka', 'Pickup'].map((method) => (
                    <div key={method} className="flex items-center space-x-2">
                      <RadioGroupItem value={method} id={method} />
                      <Label htmlFor={method} className="font-normal cursor-pointer">{method}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="shipping">Shipping Charge (৳)</Label>
                <Input
                  id="shipping"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('shipping_charge', { valueAsNumber: true })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Payment Method *</Label>
                <Select
                  defaultValue={initialOrder?.payment_method || 'COD'}
                  onValueChange={(value) => setValue('payment_method', value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['COD', 'bKash', 'Nagad', 'Bank Transfer', 'Paid'].map((method) => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Payment Status *</Label>
                <Select
                  defaultValue={initialOrder?.payment_status || 'Unpaid'}
                  onValueChange={(value) => setValue('payment_status', value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Unpaid', 'Partial', 'Paid'].map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Add any internal notes about this order..."
                  className="mt-1.5"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <OrderSummary items={items} shippingCharge={shippingCharge} />

          <div className="mt-6">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Saving...' : (mode === 'create' ? 'Create Order' : 'Save Changes')}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
