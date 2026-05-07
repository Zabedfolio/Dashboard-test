import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { invoices, fmt, customers } from "@/lib/mock-data";

export default function InvoicesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Invoices</h1>
        <p className="text-muted-foreground mt-2">{invoices.length} invoices</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Invoice ID</th>
              <th className="text-left p-2">Customer</th>
              <th className="text-left p-2">Date</th>
              <th className="text-right p-2">Total</th>
              <th className="text-right p-2">Due</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const customer = customers.find(c => c.id === inv.customerId);
              return (
                <tr key={inv.id} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-medium">{inv.id}</td>
                  <td className="p-2">{customer?.name || '-'}</td>
                  <td className="p-2">{inv.date}</td>
                  <td className="p-2 text-right">{fmt(inv.total)}</td>
                  <td className="p-2 text-right">{fmt(inv.due)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
