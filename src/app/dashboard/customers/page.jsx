import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { customers, fmt } from "@/lib/mock-data";
import { Phone, MapPin } from "lucide-react";

export default function CustomersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Customers</h1>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {customers.map((c) =>
        <Card key={c.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" />{c.phone}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />{c.address}
                  </p>
                </div>
                <Badge variant={c.type === "Wholesale" ? "default" : "secondary"}>{c.type}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground">Purchases</p>
                  <p className="font-semibold">{fmt(c.totalPurchases)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground">Due</p>
                  <p className="font-semibold">{fmt(c.due)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
