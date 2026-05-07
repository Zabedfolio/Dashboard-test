 'use client';

import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Wallet, Coins, AlertCircle, Loader2, PieChart } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar } from
"recharts";
import { useEffect, useState } from "react";
import { getDashboardStats, getSalesTrend } from "@/lib/dashboard";
import { fmt } from "@/lib/mock-data";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    todaySales: 0,
    monthlyRevenue: 0,
    netProfit: 0,
    pendingDue: 0,
    lowStock: [],
    recentOrders: [],
    customerReport: [],
    totalOrdersCount: 0
  });
  const [trend, setTrend] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [s, t] = await Promise.all([
          getDashboardStats(),
          getSalesTrend()
        ]);
        if (s) setStats(s);
        if (t) setTrend(t);
      } catch (error) {
        console.error("Dashboard load error:", error);
        setErrorMsg(error.message || "Failed to connect to database");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse uppercase tracking-widest">Initializing Command Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-10">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight">COMMAND CENTER</h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold opacity-70">Real-time Business Performance</p>
        </div>
        {errorMsg && (
          <Badge variant="destructive" className="animate-pulse bg-red-500/10 text-red-500 border-red-500/20">
            <AlertCircle className="w-3 h-3 mr-1" /> DATABASE ERROR: {errorMsg}
          </Badge>
        )}
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today Sales" value={fmt(stats.todaySales)} delta="Real-time" icon={TrendingUp} tone="primary" />
        <StatCard label="Monthly Revenue" value={fmt(stats.monthlyRevenue)} delta={`${stats.totalOrdersCount} Orders`} icon={Wallet} tone="success" />
        <StatCard label="Estimated Profit" value={fmt(stats.netProfit)} delta="Est. 25% margin" icon={Coins} tone="warning" />
        <StatCard label="Pending Due" value={fmt(stats.pendingDue)} delta="From orders" icon={AlertCircle} tone="danger" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Sales Trend Chart */}
        <Card className="lg:col-span-2 border-border/40 bg-card/40 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> SALES PERFORMANCE
            </CardTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">LIVE TREND</Badge>
          </CardHeader>
          <CardContent className="h-[280px] pt-4">
            {trend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs italic">
                Insufficient data for trend chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `৳${v}`} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12
                    }} />
                  
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="var(--primary)" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Customers Report Chart */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-500" /> TOP CUSTOMERS
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] pt-4">
            {stats.customerReport.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs italic">
                No customer data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.customerReport} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" fontSize={10} width={80} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="purchases" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card className="border-border/40 bg-card/40">
          <CardHeader className="pb-2 border-b"><CardTitle className="text-sm font-bold uppercase tracking-widest">Recent Activity</CardTitle></CardHeader>
          <CardContent className="p-0">
            {stats.recentOrders.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm italic">
                Awaiting first order...
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {stats.recentOrders.map((i) =>
                <li key={i.id} className="flex items-center justify-between gap-3 px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{i.customers?.name || "Walk-in Customer"}</p>
                      <p className="text-[10px] text-muted-foreground font-mono uppercase mt-0.5">{i.order_id} · {new Date(i.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black">{fmt(i.total_amount)}</p>
                      <Badge variant="outline" className="text-[9px] uppercase font-bold h-5 px-1.5">{i.order_status}</Badge>
                    </div>
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Combined */}
        <Card className="border-border/40 bg-card/40">
          <CardHeader className="pb-2 border-b"><CardTitle className="text-sm font-bold uppercase tracking-widest text-red-500">Inventory Alerts</CardTitle></CardHeader>
          <CardContent className="p-0">
            {stats.lowStock.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm italic">
                Inventory is healthy.
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {stats.lowStock.map((p, i) => (
                  <li key={i} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-bold">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono uppercase mt-0.5">SKU: {p.sku}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="font-bold text-[10px] px-2">{p.stock} Units</Badge>
                      <p className="text-[9px] text-muted-foreground mt-1 uppercase">Below {p.low_stock_threshold || 10}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>);
}