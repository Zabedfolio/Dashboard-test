 'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmt } from "@/lib/mock-data";
import { Phone, MapPin, Loader2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { getCustomers } from "@/lib/customers";
import { Button } from "@/components/ui/button";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (error) {
        console.error("Failed to load customers:", error);
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
        <h1 className="text-2xl sm:text-3xl font-bold">Customers</h1>
        <Button className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">
          <UserPlus className="w-4 h-4 mr-2" /> Add Customer
        </Button>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-border/40">
          <p className="text-muted-foreground italic">No customers found in the database.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {customers.map((c) =>
          <Card key={c.id} className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate text-lg">{c.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />{c.phone || "No phone"}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />{c.address || "No address"}
                    </p>
                  </div>
                  <Badge variant={c.type === "Wholesale" ? "default" : "secondary"}>{c.type}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Purchases</p>
                    <p className="font-bold text-sm">{fmt(c.totalPurchases)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Due Amount</p>
                    <p className="font-bold text-sm text-red-500">{fmt(c.due)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
