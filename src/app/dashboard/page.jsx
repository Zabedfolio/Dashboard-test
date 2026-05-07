 'use client';

import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Wallet, Coins, AlertCircle } from "lucide-react";
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
import { expenses, fmt, invoices, products, salesTrend, topProducts } from "@/lib/mock-data";

export default function DashboardPage() {
  const todaySales = invoices.
  filter((i) => i.date === new Date().toISOString().slice(0, 10)).
  reduce((s, i) => s + i.total, 0);
  const monthlyRevenue = invoices.reduce((s, i) => s + i.total, 0);
  const totalCost = invoices.reduce(
    (s, i) =>
    s +
    i.items.reduce((ss, it) => {
      const p = products.find((p) => p.id === it.productId);
      const v = p?.variants.find((v) => v.id === it.variantId);
      return ss + (v?.costPrice ?? 0) * it.qty;
    }, 0),
    0
  );
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = monthlyRevenue - totalCost - totalExp;
  const pendingDue = invoices.reduce((s, i) => s + i.due, 0);
  const lowStock = products.flatMap((p) =>
  p.variants.filter((v) => v.stock <= 10).map((v) => ({ p, v }))
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today Sales" value={fmt(todaySales)} delta="+12% vs yesterday" icon={TrendingUp} tone="primary" />
        <StatCard label="Monthly Revenue" value={fmt(monthlyRevenue)} delta="This month" icon={Wallet} tone="success" />
        <StatCard label="Net Profit" value={fmt(netProfit)} delta="Revenue - Cost - Expense" icon={Coins} tone="warning" />
        <StatCard label="Pending Due" value={fmt(pendingDue)} delta={`${invoices.filter((i) => i.due > 0).length} customers`} icon={AlertCircle} tone="danger" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Sales Trend · 14 days</CardTitle>
            <Badge variant="secondary">Revenue & Profit</Badge>
          </CardHeader>
          <CardContent className="h-[260px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrend} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12
                  }} />
                
                <Line type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="profit" stroke="var(--success)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Selling</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis dataKey="name" type="category" width={110} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12
                  }} />
                
                <Bar dataKey="sold" fill="var(--primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Recent Sales</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {invoices.slice(0, 5).map((i) =>
              <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{i.customerName}</p>
                    <p className="text-xs text-muted-foreground">{i.number} · {i.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{fmt(i.total)}</p>
                    <Badge
                    variant="outline"
                    className={
                    i.status === "Paid" ?
                    "border-[color:var(--success)] text-[color:var(--success)]" :
                    i.status === "Partial" ?
                    "border-[color:var(--warning)] text-[color:var(--warning-foreground)]" :
                    "border-destructive text-destructive"
                    }>
                    {i.status}</Badge>
                  </div>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Low Stock</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {lowStock.slice(0, 6).map(({ p, v }) =>
              <li key={v.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{p.name} · {v.name}</p>
                    <p className="text-xs text-muted-foreground">{p.brand} · SKU {v.sku}</p>
                  </div>
                  <Badge className={v.stock === 0 ? "bg-destructive" : "bg-[color:var(--warning)] text-[color:var(--warning-foreground)]"}>
                    {v.stock} left
                  </Badge>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Recent Expenses</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {expenses.slice(0, 5).map((e) =>
            <li key={e.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{e.item}</p>
                  <p className="text-xs text-muted-foreground">{e.date} · {e.brand} · {e.paymentMethod}</p>
                </div>
                <p className="text-sm font-semibold text-destructive">- {fmt(e.amount)}</p>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>);

}