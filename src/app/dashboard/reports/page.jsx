 "use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { fmt } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { getCustomers } from "@/lib/customers";
import { getOrders } from "@/lib/orders";
import { Loader2, PieChart } from "lucide-react";

export default function ReportsPage() {
  const [customerData, setCustomerData] = useState([]);
  const [orderStats, setOrderStats] = useState({ count: 0, revenue: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [customers, orders] = await Promise.all([
          getCustomers(),
          getOrders()
        ]);

        // Top 5 customers by purchases
        const topCustomers = customers
          .sort((a, b) => b.totalPurchases - a.totalPurchases)
          .slice(0, 5)
          .map(c => ({
            name: c.name,
            purchases: c.totalPurchases
          }));

        setCustomerData(topCustomers);
        setOrderStats({
          count: orders.length,
          revenue: orders.reduce((s, i) => s + Number(i.total_amount), 0)
        });
      } catch (error) {
        console.error("Failed to load report data:", error);
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Business Reports</h1>
          <p className="text-sm text-muted-foreground mt-1 truncate">Real-time performance analytics from your database.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black">{orderStats.count}</p>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-indigo-500/5 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black text-primary">{fmt(orderStats.revenue)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 bg-card/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-500" />
            Top Customers by Sales Volume
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] pt-6">
          {customerData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground italic">
              No sales data available to generate charts.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `৳${v/1000}k`} />
                <Tooltip 
                  cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}
                />
                <Bar dataKey="purchases" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
