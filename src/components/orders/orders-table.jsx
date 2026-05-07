'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Trash2, Flag } from 'lucide-react'
import { StatusBadge } from './status-badge'
import { formatOrderAmount, formatDateOnly, formatItems } from '@/lib/orders-utils'
import { toast } from 'sonner'

export function OrdersTable({ 
  orders = [], 
  onDelete, 
  onFlag, 
  onStatusUpdate,
  loading = false,
  selectedIds = new Set(),
  onSelectionChange
}) {
  const toggleRow = (id) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    onSelectionChange?.(newSelected)
  }

  const toggleAll = () => {
    if (selectedIds.size === orders.length && orders.length > 0) {
      onSelectionChange?.(new Set())
    } else {
      onSelectionChange?.(new Set(orders.map(o => o.id)))
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this order?')) {
      await onDelete?.(id)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading orders...</div>
  }

  if (orders.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">No orders found</div>
  }

  const statuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned']

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === orders.length && orders.length > 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-muted/40 transition-colors">
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(order.id)}
                    onCheckedChange={() => toggleRow(order.id)}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">
                  <Link href={`/dashboard/orders/${order.id}`} className="text-primary hover:underline font-medium">
                    {order.order_id}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">
                  {order.customers?.name || 'N/A'}
                </TableCell>
                <TableCell className="text-sm">
                  {order.customers?.phone || 'N/A'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatItems(order.items)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatOrderAmount(order.total_amount)}
                </TableCell>
                <TableCell className="text-xs">
                  <span className="px-2 py-1 rounded bg-muted font-medium">
                    {order.payment_status}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={order.order_status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {order.profiles?.name || 'N/A'}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {formatDateOnly(order.created_at)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/orders/${order.id}`}>
                          View/Edit Details
                        </Link>
                      </DropdownMenuItem>
                      
                      <div className="h-px bg-muted my-1" />
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Update Status
                      </div>
                      {statuses.filter(s => s !== order.order_status).map(s => (
                        <DropdownMenuItem 
                          key={s}
                          onClick={() => onStatusUpdate?.(order.id, s)}
                        >
                          Mark as {s}
                        </DropdownMenuItem>
                      ))}

                      <div className="h-px bg-muted my-1" />
                      <DropdownMenuItem
                        onClick={() => onFlag?.(order.id)}
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        Flag Order
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(order.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Order
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
