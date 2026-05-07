'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function LowStockAlerts({ products = [], onRestock }) {
  return (
    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 overflow-hidden">
      <Table>
        <TableHeader className="bg-yellow-500/10">
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-yellow-500">Product</TableHead>
            <TableHead className="text-yellow-500">SKU</TableHead>
            <TableHead className="text-yellow-500 text-center">Stock</TableHead>
            <TableHead className="text-yellow-500 text-center">Threshold</TableHead>
            <TableHead className="text-yellow-500 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                Great job! No products are currently below their stock threshold.
              </TableCell>
            </TableRow>
          ) : (
            products.map((p) => (
              <TableRow key={p.id} className="hover:bg-yellow-500/10 border-yellow-500/10 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium text-sm">{p.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-[10px] text-muted-foreground uppercase font-medium">
                  {p.sku}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 font-bold">
                    {p.stock}
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {p.low_stock_threshold}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-black border-yellow-500/20"
                    onClick={() => onRestock(p)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Restock
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
