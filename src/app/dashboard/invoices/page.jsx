 'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmt } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { getOrders } from "@/lib/orders";
import { Loader2, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getOrders();
        setInvoices(data);
      } catch (error) {
        console.error("Failed to load invoices:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">{invoices.length} total records</p>
        </div>
        <Button variant="outline" className="border-border/40 w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" /> Export All
        </Button>
      </div>

      {/* Mobile List View */}
      <div className="grid gap-3 md:hidden">
        {invoices.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground italic bg-card/20 rounded-xl border-2 border-dashed">
            No invoices found.
          </div>
        ) : (
          invoices.map((inv) => (
            <div key={inv.id} className="bg-card border border-border/40 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-bold text-primary">{inv.order_id}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium mt-0.5">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`text-[10px] uppercase font-black px-2 py-0.5 ${
                    inv.payment_status === 'Paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  }`}
                >
                  {inv.payment_status}
                </Badge>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <p className="font-semibold text-sm">{inv.customers?.name || 'Walk-in Customer'}</p>
                <p className="font-black text-lg">{fmt(inv.total_amount)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block border-border/40 overflow-hidden bg-card/40">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground">ID</th>
                <th className="text-left p-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Customer</th>
                <th className="text-left p-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Date</th>
                <th className="text-center p-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Status</th>
                <th className="text-right p-4 font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-muted-foreground italic">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    No invoices generated yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-bold text-primary font-mono text-xs">{inv.order_id}</td>
                    <td className="p-4">
                      <p className="font-semibold">{inv.customers?.name || 'Walk-in'}</p>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      <Badge 
                        variant="secondary" 
                        className={`text-[10px] uppercase font-black px-2 py-0.5 ${
                          inv.payment_status === 'Paid' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                          'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}
                      >
                        {inv.payment_status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right font-black text-base">{fmt(inv.total_amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
