'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
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
import { toast } from 'sonner'
import { getStatusPipeline, canTransitionStatus } from '@/lib/orders-utils'

export function StatusPipeline({ orderId, currentStatus, onStatusChange }) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(null)
  const pipeline = getStatusPipeline()
  const hasOtherStatuses = ['Cancelled', 'Returned'].includes(currentStatus)

  const handleStatusClick = async (newStatus) => {
    if (newStatus === currentStatus) return

    if (!canTransitionStatus(currentStatus, newStatus)) {
      toast.error(`Cannot transition from ${currentStatus} to ${newStatus}`)
      return
    }

    setSelectedStatus(newStatus)
  }

  const confirmStatusChange = async () => {
    if (!selectedStatus) return

    setIsUpdating(true)

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          note: `Status changed to ${selectedStatus}`
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update status')
      }

      onStatusChange?.(selectedStatus)
      toast.success(`Order status updated to ${selectedStatus}`)
      setSelectedStatus(null)
    } catch (error) {
      toast.error(error.message || 'Failed to update status')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-sm">Order Status</h3>

        {hasOtherStatuses && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-destructive/10 text-destructive">
              {currentStatus}
            </span>
          </div>
        )}

        {!hasOtherStatuses && (
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {pipeline.map((status, index) => {
              const isCurrentOrPast = pipeline.indexOf(currentStatus) >= index
              const isCurrent = status === currentStatus

              return (
                <div key={status} className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleStatusClick(status)}
                    disabled={isUpdating}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : isCurrentOrPast
                        ? 'bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80'
                        : 'bg-muted/30 text-muted-foreground'
                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {status}
                  </button>
                  {index < pipeline.length - 1 && (
                    <div className="w-2 h-0.5 bg-muted" />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {['Cancelled', 'Returned'].map((altStatus) => (
          <Button
            key={altStatus}
            variant={currentStatus === altStatus ? 'default' : 'outline'}
            onClick={() => handleStatusClick(altStatus)}
            disabled={isUpdating || currentStatus === 'Delivered'}
            className="w-full"
          >
            {altStatus === 'Cancelled' ? 'Cancel Order' : 'Mark as Returned'}
          </Button>
        ))}
      </div>

      <AlertDialog open={!!selectedStatus} onOpenChange={(open) => !open && setSelectedStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Order Status</AlertDialogTitle>
            <AlertDialogDescription>
              Change order status from <strong>{currentStatus}</strong> to <strong>{selectedStatus}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
