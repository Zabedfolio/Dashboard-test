'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { OrderFilters } from './order-filters'
import { OrdersTable } from './orders-table'
import { Pagination } from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { exportOrdersToCSV } from '@/lib/orders-utils'

export function OrdersListClient() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState('All')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showFlagDialog, setShowFlagDialog] = useState(false)
  const [flaggingOrderId, setFlaggingOrderId] = useState(null)
  const [flagReason, setFlagReason] = useState('')

  const fetchOrders = async (pageNum = 1) => {
    setIsLoading(true)

    try {
      const queryParams = new URLSearchParams({
        page: pageNum,
        limit: 20,
        ...(status && status !== 'All' && { status }),
        ...(paymentMethod && { paymentMethod }),
        ...(search && { search })
      })

      const response = await fetch(`/api/orders?${queryParams}`)
      const result = await response.json()

      if (response.ok) {
        setOrders(result.data || [])
        setPagination(result.pagination || {})
        setPage(pageNum)
      } else {
        toast.error(result.error || 'Failed to fetch orders')
      }
    } catch (error) {
      toast.error('Failed to fetch orders')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(1)
  }, [])

  const handleApplyFilters = () => {
    fetchOrders(1)
  }

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setOrders(orders.filter(o => o.id !== id))
        toast.success('Order deleted')
      } else {
        toast.error('Failed to delete order')
      }
    } catch (error) {
      toast.error('Failed to delete order')
    }
  }

  const handleFlag = (id) => {
    setFlaggingOrderId(id)
    setShowFlagDialog(true)
  }

  const confirmFlag = async () => {
    if (!flagReason.trim()) {
      toast.error('Please enter a flag reason')
      return
    }

    try {
      const response = await fetch(`/api/orders/${flaggingOrderId}/flag`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isFlagged: true,
          flagReason: flagReason.trim()
        })
      })

      if (response.ok) {
        fetchOrders(page)
        setShowFlagDialog(false)
        setFlagReason('')
        setFlaggingOrderId(null)
        toast.success('Order flagged')
      } else {
        toast.error('Failed to flag order')
      }
    } catch (error) {
      toast.error('Failed to flag order')
    }
  }

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: `Status updated via list view` })
      })

      if (response.ok) {
        setOrders(orders.map(o => o.id === id ? { ...o, order_status: newStatus } : o))
        toast.success(`Order status updated to ${newStatus}`)
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleBulkAction = async (action) => {
    if (action === 'export') {
      const selectedOrders = orders.filter(o => selectedIds.has(o.id))
      exportOrdersToCSV(selectedIds.size > 0 ? selectedOrders : orders)
      toast.success(selectedIds.size > 0 ? 'Exporting selected orders...' : 'Exporting all current orders...')
      return
    }

    if (selectedIds.size === 0) {
      toast.error('Please select at least one order')
      return
    }

    const statusMap = {
      'processing': 'Processing',
      'cancel': 'Cancelled'
    }

    const targetStatus = statusMap[action]
    if (!targetStatus) return

    const toastId = toast.loading(`Updating ${selectedIds.size} orders...`)

    try {
      // For now, we loop because we don't have a bulk API endpoint
      // In a real high-scale app, we'd add a dedicated /api/orders/bulk endpoint
      const promises = Array.from(selectedIds).map(id => 
        fetch(`/api/orders/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: targetStatus, note: `Bulk status update to ${targetStatus}` })
        })
      )

      await Promise.all(promises)
      
      toast.success(`${selectedIds.size} orders updated to ${targetStatus}`, { id: toastId })
      fetchOrders(page)
      setSelectedIds(new Set())
    } catch (error) {
      toast.error('Some orders failed to update', { id: toastId })
    }
  }

  const totalPages = pagination.totalPages || 1

  return (
    <div className="space-y-6">
      <OrderFilters
        status={status}
        onStatusChange={setStatus}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        search={search}
        onSearchChange={setSearch}
        onApplyFilters={handleApplyFilters}
        selectedRowsCount={selectedIds.size}
        onBulkAction={handleBulkAction}
      />

      <OrdersTable
        orders={orders}
        loading={isLoading}
        onDelete={handleDelete}
        onFlag={handleFlag}
        onStatusUpdate={handleStatusUpdate}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => fetchOrders(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => fetchOrders(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Flag Order</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a reason for flagging this order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <Label htmlFor="flag-reason">Reason *</Label>
            <Input
              id="flag-reason"
              placeholder="e.g., Suspicious activity, Customer complaint..."
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFlag}>
              Flag
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
