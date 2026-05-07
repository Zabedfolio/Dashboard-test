'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatOrderAmount, calculateItemsSubtotal, calculateOrderTotal } from '@/lib/orders-utils'

export function OrderSummary({ items = [], shippingCharge = 0 }) {
  const itemsSubtotal = calculateItemsSubtotal(items)
  const total = calculateOrderTotal(items, shippingCharge)

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-base">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Items Subtotal</span>
            <span className="font-medium">{formatOrderAmount(itemsSubtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping Charge</span>
            <span className="font-medium">{formatOrderAmount(shippingCharge)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold text-base">
            <span>Grand Total</span>
            <span className="text-primary">{formatOrderAmount(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
