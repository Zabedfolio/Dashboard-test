'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  History,
  AlertTriangle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from './StatusBadge'
import Image from 'next/image'
import Link from 'next/link'

export function ProductsTable({ 
  products = [], 
  selectedIds = [], 
  onSelectChange,
  onDelete,
  onDuplicate,
  isAdmin
}) {
  const toggleAll = () => {
    if (selectedIds.length === products.length) {
      onSelectChange([])
    } else {
      onSelectChange(products.map(p => p.id))
    }
  }

  const toggleOne = (id) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter(i => i !== id))
    } else {
      onSelectChange([...selectedIds, id])
    }
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="grid gap-4 md:hidden">
        {products.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground bg-card/20 rounded-xl border border-dashed">
            No products found.
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
              <div className="flex gap-4">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted border border-border/40 shrink-0">
                  {product.images?.[0] ? (
                    <Image 
                      src={product.images[0]} 
                      alt={product.name} 
                      fill 
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase font-bold">
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link 
                      href={`/dashboard/products/${product.id}`}
                      className="font-bold text-base truncate block hover:text-primary transition-colors"
                    >
                      {product.name}
                    </Link>
                    <Checkbox 
                      checked={selectedIds.includes(product.id)}
                      onCheckedChange={() => toggleOne(product.id)}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mt-0.5">{product.sku}</p>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-black text-primary">৳{parseFloat(product.unit_price).toLocaleString()}</p>
                    <StatusBadge 
                      status={product.status} 
                      stock={product.stock} 
                      threshold={product.low_stock_threshold} 
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">In Stock:</span>
                    <span className={`text-sm font-bold ${product.stock < product.low_stock_threshold ? 'text-yellow-500' : ''}`}>
                      {product.stock} {product.unit}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{product.categories?.name || 'Uncategorized'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild className="h-8 px-3 text-xs">
                    <Link href={`/dashboard/products/${product.id}`}>
                      <Edit className="w-3 h-3 mr-1.5" /> Edit
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-card border-border/40">
                      <DropdownMenuItem onClick={() => onDuplicate(product.id)} className="cursor-pointer">
                        <Copy className="mr-2 h-4 w-4" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(product.id)} 
                        className="text-red-500 cursor-pointer"
                        disabled={!isAdmin}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-border/40 bg-card/20 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={products.length > 0 && selectedIds.length === products.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(product.id)}
                      onCheckedChange={() => toggleOne(product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted border border-border/40 shrink-0">
                        {product.images?.[0] ? (
                          <Image 
                            src={product.images[0]} 
                            alt={product.name} 
                            fill 
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                            IMG
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <Link 
                          href={`/dashboard/products/${product.id}`}
                          className="font-medium truncate hover:text-primary transition-colors"
                        >
                          {product.name}
                        </Link>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {product.sku}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {product.categories?.name || 'Uncategorized'}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    ৳{parseFloat(product.unit_price).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${product.stock < product.low_stock_threshold ? 'text-yellow-500' : ''}`}>
                          {product.stock}
                        </span>
                        {product.stock < product.low_stock_threshold && product.stock > 0 && (
                          <AlertTriangle className="w-3 h-3 text-yellow-500" />
                        )}
                        <span className="text-[10px] text-muted-foreground uppercase">{product.unit}</span>
                      </div>
                      {product.variants?.length > 0 && (product.unit === 'kg' || product.unit === 'litre') && (
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {product.variants.map((v, i) => (
                            <div key={i} className="text-[9px] px-1 py-0.5 bg-primary/10 text-primary rounded border border-primary/20 flex items-center gap-1" title={`${v.label} Available`}>
                              <span className="font-bold">{Math.floor(product.stock / (v.weight_kg || 1))}</span>
                              <span className="opacity-70">{v.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge 
                      status={product.status} 
                      stock={product.stock} 
                      threshold={product.low_stock_threshold} 
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 bg-card border-border/40">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/products/${product.id}`} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(product.id)} className="cursor-pointer">
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(product.id)} 
                          className="text-red-500 cursor-pointer"
                          disabled={!isAdmin}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
