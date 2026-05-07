"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { salesTrend, fmt, invoices } from "@/lib/mock-data";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function SalesPage() {
  const totalSales = invoices.reduce((s, i) => s + i.total, 0);
  const avgSale = totalSales / invoices.length;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales</h1>
        <p className="text-muted-foreground mt-2">Sales performance and trends</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{fmt(totalSales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{fmt(avgSale)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Trend (14 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesTrend}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="var(--primary)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
