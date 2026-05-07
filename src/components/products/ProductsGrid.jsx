'use client'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { StatusBadge } from './StatusBadge'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Edit, Copy, Trash2, AlertTriangle } from 'lucide-react'

export function ProductsGrid({ 
  products = [], 
  onDelete, 
  onDuplicate, 
  isAdmin 
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="group overflow-hidden border-border/40 bg-card/40 hover:bg-card/60 transition-all">
          <div className="relative aspect-square bg-muted">
            {product.images?.[0] ? (
              <Image 
                src={product.images[0]} 
                alt={product.name} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
            <div className="absolute top-2 right-2 flex flex-col gap-2">
              <StatusBadge 
                status={product.status} 
                stock={product.stock} 
                threshold={product.low_stock_threshold} 
              />
            </div>
            {product.stock < product.low_stock_threshold && product.stock > 0 && (
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-yellow-500/90 text-black text-[10px] font-bold rounded flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                LOW STOCK
              </div>
            )}
          </div>
          
          <CardContent className="p-4">
            <div className="flex justify-between items-start gap-2 mb-1">
              <Link 
                href={`/dashboard/products/${product.id}`}
                className="font-semibold text-lg truncate hover:text-primary transition-colors"
              >
                {product.name}
              </Link>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
              {product.sku} • {product.categories?.name || 'Uncategorized'}
            </p>
            
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">
                ৳{parseFloat(product.unit_price).toLocaleString()}
              </span>
              {product.discount > 0 && (
                <span className="text-xs text-muted-foreground line-through italic">
                  ৳{(parseFloat(product.unit_price) + parseFloat(product.discount)).toLocaleString()}
                </span>
              )}
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                In Stock: <span className="font-semibold text-foreground">{product.stock} {product.unit}</span>
              </span>
            </div>
          </CardContent>

          <CardFooter className="p-2 pt-0 grid grid-cols-3 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="secondary" size="icon" className="h-8 w-full" asChild>
              <Link href={`/dashboard/products/${product.id}`}>
                <Edit className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button variant="secondary" size="icon" className="h-8 w-full" onClick={() => onDuplicate(product.id)}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-8 w-full text-red-500 hover:bg-red-500/10"
              disabled={!isAdmin}
              onClick={() => onDelete(product.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
