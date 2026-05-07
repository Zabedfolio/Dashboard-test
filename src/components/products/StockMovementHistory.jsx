'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getStockMovements } from '@/lib/stock'
import { Loader2 } from 'lucide-react'

export function StockMovementHistory({ productId }) {
  const [movements, setMovements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('All')

  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getStockMovements({ 
        product_id: productId, 
        type: typeFilter === 'All' ? null : typeFilter,
        limit: 10
      })
      setMovements(result.data || [])
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setIsLoading(false)
    }
  }, [productId, typeFilter])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const typeStyles = {
    IN: 'bg-green-500/10 text-green-500 border-green-500/20',
    OUT: 'bg-red-500/10 text-red-500 border-red-500/20',
    ADJUSTMENT: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['All', 'IN', 'OUT', 'ADJUSTMENT'].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${
              typeFilter === t 
                ? 'bg-primary border-primary text-primary-foreground' 
                : 'bg-transparent border-border/40 text-muted-foreground hover:border-primary/40'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border/40 bg-card/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="h-10">
              <TableHead className="text-[10px] uppercase font-bold">Date</TableHead>
              <TableHead className="text-[10px] uppercase font-bold text-center">Type</TableHead>
              <TableHead className="text-[10px] uppercase font-bold text-right">Qty</TableHead>
              <TableHead className="text-[10px] uppercase font-bold">Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-20 text-center">
                  <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                  <span className="text-xs text-muted-foreground">Loading history...</span>
                </TableCell>
              </TableRow>
            ) : movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-20 text-center text-xs text-muted-foreground">
                  No movements found.
                </TableCell>
              </TableRow>
            ) : (
              movements.map((move) => (
                <TableRow key={move.id} className="h-12 text-xs border-b border-border/10">
                  <TableCell className="text-muted-foreground">
                    {new Date(move.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`text-[10px] px-1 py-0 ${typeStyles[move.type]}`}>
                      {move.type}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-bold ${move.type === 'IN' ? 'text-green-500' : move.type === 'OUT' ? 'text-red-500' : 'text-blue-500'}`}>
                    {move.type === 'OUT' ? '-' : move.type === 'IN' ? '+' : ''}
                    {move.quantity}
                  </TableCell>
                  <TableCell className="max-w-[100px] truncate" title={move.note || move.reason}>
                    {move.reason}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
