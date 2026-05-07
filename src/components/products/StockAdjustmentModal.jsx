'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { adjustStock } from '@/lib/stock'
import { toast } from 'sonner'
import { TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react'

export function StockAdjustmentModal({ isOpen, onClose, product, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false)
  const [type, setType] = useState('IN')
  const [quantity, setQuantity] = useState(0)
  const [reason, setReason] = useState('Manual Adjustment')
  const [note, setNote] = useState('')
  const [reference, setReference] = useState('')

  const currentStock = product?.stock || 0
  let previewStock = currentStock
  if (type === 'IN') previewStock += Number(quantity)
  else if (type === 'OUT') previewStock = Math.max(0, currentStock - Number(quantity))
  else if (type === 'ADJUSTMENT') previewStock = Number(quantity)

  const handleSubmit = async () => {
    if (quantity <= 0 && type !== 'ADJUSTMENT') {
      toast.error('Quantity must be greater than 0')
      return
    }

    setIsLoading(true)
    try {
      await adjustStock({
        product_id: product.id,
        type,
        quantity: Number(quantity),
        reason,
        reference_id: reference,
        note
      })
      toast.success('Stock adjusted successfully')
      onSuccess?.()
      onClose()
    } catch (error) {
      toast.error(error.message || 'Failed to adjust stock')
    } finally {
      setIsLoading(false)
    }
  }

  const reasons = {
    IN: ['Purchase', 'Return', 'Manual Adjustment'],
    OUT: ['Sale', 'Damage', 'Manual Adjustment'],
    ADJUSTMENT: ['Manual Adjustment', 'Damage']
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border/40 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock: {product?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-xl border border-border/40">
            <div className="text-center flex-1">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Current</p>
              <p className="text-2xl font-bold">{currentStock}</p>
            </div>
            <div className="px-4 text-muted-foreground">
              {type === 'IN' && <TrendingUp className="text-green-500" />}
              {type === 'OUT' && <TrendingDown className="text-red-500" />}
              {type === 'ADJUSTMENT' && <RefreshCcw className="text-blue-500" />}
            </div>
            <div className="text-center flex-1">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">New</p>
              <p className={`text-2xl font-bold ${previewStock !== currentStock ? 'text-primary' : ''}`}>
                {previewStock}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <RadioGroup 
              value={type} 
              onValueChange={(val) => {
                setType(val)
                setReason('Manual Adjustment')
              }}
              className="flex gap-4 mt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="IN" id="in" />
                <Label htmlFor="in" className="font-normal cursor-pointer">Stock In</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="OUT" id="out" />
                <Label htmlFor="out" className="font-normal cursor-pointer">Stock Out</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ADJUSTMENT" id="adj" />
                <Label htmlFor="adj" className="font-normal cursor-pointer">Set New Value</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qty">{type === 'ADJUSTMENT' ? 'New Total' : 'Quantity'}</Label>
              <Input 
                id="qty" 
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reasons[type].map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ref">Reference (Optional)</Label>
            <Input 
              id="ref" 
              placeholder="e.g. Invoice #123"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea 
              id="note" 
              placeholder="Internal adjustment note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Confirm Adjustment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
