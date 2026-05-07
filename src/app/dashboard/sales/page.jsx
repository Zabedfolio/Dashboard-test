 "use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmt } from "@/lib/mock-data";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useEffect, useState } from "react";
import { getOrders } from "@/lib/orders";
import { getSalesTrend } from "@/lib/dashboard";
import { Loader2, TrendingUp, BarChart3 } from "lucide-react";

export default function SalesPage() {
  const [invoices, setInvoices] = useState([]);
  const [trend, setTrend] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [orders, trendData] = await Promise.all([
          getOrders(),
          getSalesTrend()
        ]);
        setInvoices(orders);
        setTrend(trendData);
      } catch (error) {
        console.error("Failed to load sales data:", error);
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

  const totalSales = invoices.reduce((s, i) => s + Number(i.total_amount), 0);
  const avgSale = invoices.length > 0 ? totalSales / invoices.length : 0;
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">Deep dive into your revenue performance.</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <TrendingUp className="w-3 h-3" /> Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black">{fmt(totalSales)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-3 h-3" /> Average Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black">{fmt(avgSale)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 bg-card/40">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold">Revenue Growth (14 Days)</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] pt-4">
          {trend.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground italic">
              Insufficient data for trend analysis.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `৳${v}`} />
                <Tooltip 
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="var(--primary)" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: 'var(--background)' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
