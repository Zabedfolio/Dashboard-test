'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  ArrowLeft, 
  TrendingDown, 
  History, 
  Download, 
  Loader2,
  RefreshCw,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LowStockAlerts } from '@/components/products/LowStockAlerts'
import { StockAdjustmentModal } from '@/components/products/StockAdjustmentModal'
import { 
  getStockMovements, 
  getLowStockProducts, 
  exportStockCSV 
} from '@/lib/stock'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'

export default function StockManagementPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [activeTab, setActiveTab] = useState('alerts')
  const [lowStockProds, setLowStockProds] = useState([])
  const [movements, setMovements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      if (activeTab === 'alerts') {
        const data = await getLowStockProducts()
        setLowStockProds(data)
      } else {
        const result = await getStockMovements({ page, limit: 15 })
        setMovements(result.data || [])
        setTotalPages(result.totalPages)
      }
    } catch (error) {
      toast.error('Failed to load stock data')
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRestock = (product) => {
    setSelectedProduct(product)
    setIsAdjModalOpen(true)
  }

  const handleExport = async () => {
    try {
      const data = await exportStockCSV()
      const csvContent = "data:text/csv;charset=utf-8," 
        + [Object.keys(data[0]).join(","), ...data.map(row => Object.values(row).join(","))].join("\n")
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `stock_log_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      toast.error('Export failed')
    }
  }

  const typeStyles = {
    IN: 'bg-green-500/10 text-green-500 border-green-500/20',
    OUT: 'bg-red-500/10 text-red-500 border-red-500/20',
    ADJUSTMENT: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  }

  return (
    <div className="p-6 space-y-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="rounded-full border-border/40" asChild>
            <Link href="/dashboard/products">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Stock Management</h1>
            <p className="text-sm text-muted-foreground">Monitor inventory levels and track stock movements.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'logs' && isAdmin && (
            <Button variant="outline" size="sm" onClick={handleExport} className="border-border/40">
              <Download className="w-4 h-4 mr-2" /> Export Log
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 border border-border/40 p-1 rounded-xl h-11 w-full max-w-md">
          <TabsTrigger value="alerts" className="rounded-lg gap-2 flex-1">
            <TrendingDown className="w-4 h-4" /> Low Stock
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-lg gap-2 flex-1">
            <History className="w-4 h-4" /> Movement Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="animate-in fade-in slide-in-from-top-2">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <LowStockAlerts products={lowStockProds} onRestock={handleRestock} />
          )}
        </TabsContent>

        <TabsContent value="logs" className="animate-in fade-in slide-in-from-top-2">
          <div className="rounded-xl border border-border/40 bg-card/20 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-xs text-muted-foreground">Fetching movements...</p>
                    </TableCell>
                  </TableRow>
                ) : movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                      No stock movements recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((m) => (
                    <TableRow key={m.id} className="hover:bg-muted/10">
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(m.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{m.products?.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{m.products?.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[10px] uppercase ${typeStyles[m.type]}`}>
                          {m.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-center font-bold ${m.type === 'IN' ? 'text-green-500' : m.type === 'OUT' ? 'text-red-500' : 'text-blue-500'}`}>
                        {m.type === 'OUT' ? '-' : m.type === 'IN' ? '+' : ''}{m.quantity}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span>{m.reason}</span>
                          {m.note && <span className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">{m.note}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.profiles?.name || m.profiles?.email}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <span className="flex items-center px-4 text-xs font-medium text-muted-foreground">Page {page} of {totalPages}</span>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <StockAdjustmentModal 
        isOpen={isAdjModalOpen}
        onClose={() => {
          setIsAdjModalOpen(false)
          setSelectedProduct(null)
        }}
        product={selectedProduct}
        onSuccess={fetchData}
      />
    </div>
  )
}
