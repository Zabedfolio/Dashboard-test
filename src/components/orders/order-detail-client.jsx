'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { ArrowLeft, Flag, Printer, Trash2 } from 'lucide-react'
import { StatusPipeline } from './status-pipeline'
import { StatusHistory } from './status-history'
import { CommentSection } from './comment-section'
import { OrderForm } from './order-form'
import { StatusBadge } from './status-badge'
import { formatDate } from '@/lib/orders-utils'

export function OrderDetailClient({ initialOrder, userRole }) {
  const router = useRouter()
  const [order, setOrder] = useState(initialOrder)
  const [showFlagDialog, setShowFlagDialog] = useState(false)
  const [flagReason, setFlagReason] = useState(initialOrder.flag_reason || '')
  const [isFlagging, setIsFlagging] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isAdmin = userRole === 'admin'

  const handleStatusChange = (newStatus) => {
    setOrder((prev) => ({ ...prev, order_status: newStatus }))
  }

  const handleUnflag = async () => {
    setIsFlagging(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/flag`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFlagged: false, flagReason: '' }),
      })
      if (res.ok) {
        setOrder((prev) => ({ ...prev, is_flagged: false, flag_reason: '' }))
        setFlagReason('')
        toast.success('Order unflagged')
      } else {
        toast.error('Failed to unflag order')
      }
    } catch {
      toast.error('Failed to unflag order')
    } finally {
      setIsFlagging(false)
    }
  }

  const confirmFlag = async () => {
    if (!flagReason.trim()) {
      toast.error('Please enter a flag reason')
      return
    }
    setIsFlagging(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/flag`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFlagged: true, flagReason: flagReason.trim() }),
      })
      if (res.ok) {
        setOrder((prev) => ({
          ...prev,
          is_flagged: true,
          flag_reason: flagReason.trim(),
        }))
        setShowFlagDialog(false)
        toast.success('Order flagged')
      } else {
        toast.error('Failed to flag order')
      }
    } catch {
      toast.error('Failed to flag order')
    } finally {
      setIsFlagging(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Order deleted')
        router.push('/dashboard/orders')
        router.refresh()
      } else {
        const result = await res.json()
        toast.error(result.error || 'Failed to delete order')
      }
    } catch {
      toast.error('Failed to delete order')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm" className="mt-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Orders
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold font-mono tracking-tight">
                {order.order_id}
              </h1>
              <StatusBadge status={order.order_status} />
              {order.is_flagged && (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <Flag className="h-3 w-3" />
                  Flagged
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Created {formatDate(order.created_at)}
              {order.created_by_profile?.name && (
                <> · by <span className="font-medium">{order.created_by_profile.name}</span></>
              )}
            </p>
            {order.is_flagged && order.flag_reason && (
              <p className="text-xs text-destructive mt-1">
                Flag reason: {order.flag_reason}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Flag / Unflag */}
          {order.is_flagged ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnflag}
              disabled={isFlagging}
            >
              <Flag className="h-4 w-4 mr-2" />
              {isFlagging ? 'Unflagging…' : 'Unflag'}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFlagDialog(true)}
              disabled={isFlagging}
            >
              <Flag className="h-4 w-4 mr-2" />
              Flag Order
            </Button>
          )}

          {/* Print */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>

          {/* Delete — admin only */}
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {order.order_id}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes the order, its status history, and all
                    comments. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Deleting…' : 'Yes, Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* ── Status Pipeline ────────────────────────────────────── */}
      <StatusPipeline
        orderId={order.id}
        currentStatus={order.order_status}
        onStatusChange={handleStatusChange}
      />

      {/* ── Main Grid: Form | History + Comments ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OrderForm
            mode="edit"
            initialOrder={order}
            onSuccess={() => {
              toast.success('Order saved')
            }}
          />
        </div>

        <div className="space-y-6">
          <StatusHistory history={order.statusHistory || []} />
          <CommentSection
            orderId={order.id}
            comments={order.comments || []}
          />
        </div>
      </div>

      {/* ── Flag Dialog ───────────────────────────────────────── */}
      <AlertDialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Flag Order {order.order_id}</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a reason. This will be visible to all admins and moderators.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="flag-reason-detail">Reason *</Label>
            <Textarea
              id="flag-reason-detail"
              placeholder="e.g., Suspicious activity, Customer complaint, Payment issue…"
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFlag} disabled={isFlagging}>
              {isFlagging ? 'Flagging…' : 'Flag Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
