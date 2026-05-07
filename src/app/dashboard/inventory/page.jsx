import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { products } from "@/lib/mock-data";

export default function InventoryPage() {
  const lowStockItems = products.flatMap((p) =>
    p.variants.filter((v) => v.stock <= 10).map((v) => ({ p, v }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory</h1>
        <p className="text-muted-foreground mt-2">Track stock levels</p>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div key={`${item.p.id}-${item.v.id}`} className="flex justify-between text-sm">
                  <span>{item.p.name} - {item.v.type}</span>
                  <Badge variant="outline">{item.v.stock} left</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {products.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="text-lg">{p.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {p.variants.map((v) => (
                  <div key={v.id}>
                    <p className="text-sm font-medium">{v.type}</p>
                    <p className="text-2xl font-bold">{v.stock}</p>
                    <p className="text-xs text-muted-foreground">units</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
