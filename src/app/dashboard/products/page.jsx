import { products, fmt } from "@/lib/mock-data";

export default function ProductsPage() {
  const rows = products.flatMap((product) =>
    product.variants.map((variant) => {
      const margin = variant.sellingPrice - variant.costPrice;
      return {
        product,
        variant,
        margin,
        marginPercent: variant.sellingPrice ? Math.round((margin / variant.sellingPrice) * 100) : 0,
        stockValue: variant.costPrice * variant.stock,
      };
    })
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="text-muted-foreground mt-2">
          {rows.length} SKUs across {products.length} product groups
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium">Product</th>
              <th className="p-3 text-left font-medium">SKU</th>
              <th className="p-3 text-left font-medium">Variant</th>
              <th className="p-3 text-right font-medium">Cost</th>
              <th className="p-3 text-right font-medium">Selling</th>
              <th className="p-3 text-right font-medium">Margin</th>
              <th className="p-3 text-right font-medium">Stock</th>
              <th className="p-3 text-right font-medium">Stock Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product, variant, margin, marginPercent, stockValue }) => (
              <tr key={variant.id} className="border-b last:border-b-0 hover:bg-muted/40">
                <td className="p-3">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-xs text-muted-foreground">{product.brand} · {product.type}</div>
                </td>
                <td className="p-3 font-mono text-xs">{variant.sku}</td>
                <td className="p-3">{variant.name}</td>
                <td className="p-3 text-right tabular-nums">{fmt(variant.costPrice)}</td>
                <td className="p-3 text-right tabular-nums">{fmt(variant.sellingPrice)}</td>
                <td className="p-3 text-right tabular-nums">
                  <div>{fmt(margin)}</div>
                  <div className="text-xs text-muted-foreground">{marginPercent}%</div>
                </td>
                <td className="p-3 text-right tabular-nums">
                  <span className={variant.stock <= 10 ? "font-medium text-destructive" : ""}>
                    {variant.stock}
                  </span>
                </td>
                <td className="p-3 text-right tabular-nums font-medium">{fmt(stockValue)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/30">
              <td className="p-3 font-medium" colSpan={6}>Inventory Total</td>
              <td className="p-3 text-right tabular-nums font-medium">
                {rows.reduce((sum, row) => sum + row.variant.stock, 0)}
              </td>
              <td className="p-3 text-right tabular-nums font-semibold">
                {fmt(rows.reduce((sum, row) => sum + row.stockValue, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
