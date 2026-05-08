'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Package, ShoppingCart, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ orders: [], products: [], customers: [] });
  const [loading, setLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setResults({ orders: [], products: [], customers: [] });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = useCallback(async (searchQuery) => {
    try {
      setLoading(true);

      // Search products
      const productsRes = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
      const productsData = await productsRes.json();

      // Search orders - basic search by order ID
      const ordersRes = await fetch(`/api/orders?search=${encodeURIComponent(searchQuery)}`);
      const ordersData = await ordersRes.json();

      setResults({
        orders: ordersData.data?.filter(o => 
          o.order_id.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5) || [],
        products: productsData.data?.slice(0, 5) || [],
        customers: [] // Could add customers search if endpoint exists
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const totalResults = results.orders.length + results.products.length + results.customers.length;

  return (
    <div className="relative hidden lg:block">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search orders, products..."
          className="h-9 w-64 pl-8"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute top-full mt-2 right-0 z-50 w-96 bg-background border rounded-lg shadow-lg overflow-hidden">
            {query.trim() ? (
              <>
                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center h-24 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Searching...
                  </div>
                )}

                {/* Results */}
                {!loading && totalResults > 0 && (
                  <div className="max-h-96 overflow-y-auto">
                    {/* Orders */}
                    {results.orders.length > 0 && (
                      <div className="border-b last:border-b-0">
                        <div className="px-4 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                          <ShoppingCart className="h-3 w-3" />
                          Orders ({results.orders.length})
                        </div>
                        <div className="divide-y">
                          {results.orders.map((order) => (
                            <Link
                              key={order.id}
                              href={`/dashboard/orders/${order.id}`}
                              className="px-4 py-2 hover:bg-muted/50 transition-colors text-sm flex items-center justify-between cursor-pointer"
                              onClick={() => setIsOpen(false)}
                            >
                              <div>
                                <p className="font-medium">{order.order_id}</p>
                                <p className="text-xs text-muted-foreground">
                                  {order.order_status} • {new Date(order.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <span className="text-xs font-semibold">
                                ${order.total_amount}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Products */}
                    {results.products.length > 0 && (
                      <div className="border-b last:border-b-0">
                        <div className="px-4 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                          <Package className="h-3 w-3" />
                          Products ({results.products.length})
                        </div>
                        <div className="divide-y">
                          {results.products.map((product) => (
                            <Link
                              key={product.id}
                              href={`/dashboard/products/${product.id}`}
                              className="px-4 py-2 hover:bg-muted/50 transition-colors text-sm cursor-pointer"
                              onClick={() => setIsOpen(false)}
                            >
                              <p className="font-medium line-clamp-1">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                SKU: {product.sku} • Stock: {product.stock}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* No Results */}
                {!loading && totalResults === 0 && (
                  <div className="flex items-center justify-center h-24 text-muted-foreground">
                    <p className="text-sm">No results found</p>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Start typing to search...
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
