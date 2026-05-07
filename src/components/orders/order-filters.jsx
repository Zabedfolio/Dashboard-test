'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search } from 'lucide-react'

export function OrderFilters({
  status,
  onStatusChange,
  paymentMethod,
  onPaymentMethodChange,
  search,
  onSearchChange,
  onApplyFilters,
  selectedRowsCount = 0,
  onBulkAction
}) {
  const statuses = ['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned']
  const paymentMethods = ['COD', 'bKash', 'Nagad', 'Bank Transfer', 'Paid']

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Order ID, customer name, or phone..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={onApplyFilters}>Apply Filters</Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <span className="text-xs text-muted-foreground">Status:</span>
          <Tabs value={status || 'All'} onValueChange={onStatusChange} className="mt-1">
            <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted">
              {statuses.map((s) => (
                <TabsTrigger key={s} value={s} className="text-xs">
                  {s}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="w-40">
          <span className="text-xs text-muted-foreground block mb-1">Payment Method:</span>
          <Select value={paymentMethod || 'all'} onValueChange={(val) => onPaymentMethodChange(val === 'all' ? '' : val)}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              {paymentMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedRowsCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedRowsCount} selected</span>
          <Button
            size="sm"
            onClick={() => onBulkAction('processing')}
          >
            Mark as Processing
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBulkAction('cancel')}
          >
            Cancel Orders
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBulkAction('export')}
          >
            Export CSV
          </Button>
        </div>
      )}
    </div>
  )
}
