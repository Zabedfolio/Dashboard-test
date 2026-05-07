"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { invoices, fmt, customers } from "@/lib/mock-data";

export default function ReportsPage() {
  // Customer purchases report
  const customerReport = customers.slice(0, 5).map((c) => ({
    name: c.name,
    purchases: c.totalPurchases,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground mt-2">Business analytics and reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Customers by Purchases</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={customerReport}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="purchases" fill="var(--primary)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{invoices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{fmt(invoices.reduce((s, i) => s + i.total, 0))}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
