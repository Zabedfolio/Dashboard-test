'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Bell, Search, LayoutDashboard, ShoppingBag, ShoppingCart, FileText, Boxes, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const titleMap = {
  "/dashboard": "Dashboard",
  "/dashboard/orders": "Orders",
  "/dashboard/sales": "Sales",
  "/dashboard/invoices": "Invoices",
  "/dashboard/inventory": "Inventory",
  "/dashboard/products": "Products",
  "/dashboard/customers": "Customers",
  "/dashboard/expenses": "Expenses",
  "/dashboard/reports": "Reports",
  "/dashboard/settings": "Settings",
  "/dashboard/admin": "Admin",
  "/dashboard/moderator": "Moderator",
  "/dashboard/profile": "Profile",
};

export function DashboardLayout({ children }) {
  const pathname = usePathname() || "/";
  const title =
  titleMap[pathname] ??
  titleMap[Object.keys(titleMap).find((k) => k !== "/" && pathname.startsWith(k)) ?? "/"] ??
  "Dashboard";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 h-14 border-b bg-background/80 backdrop-blur flex items-center gap-2 px-3 md:px-5">
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground truncate hidden sm:block">Console</span>
              <h1 className="text-sm font-semibold truncate">{title}</h1>
            </div>
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <div className="relative hidden lg:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="h-9 w-64 pl-8" />
              </div>
              <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-background" />
              </Button>
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold shrink-0">
                BO
              </div>
            </div>
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-6 pb-20 sm:pb-24 md:pb-6 max-w-full overflow-x-hidden">
            {children}
          </main>
          <MobileBottomNav />
        </div>
      </div>
    </SidebarProvider>);
}

function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const items = [
    { to: "/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
    { to: "/dashboard/invoices", label: "Invoice", icon: FileText },
    { to: "/dashboard/inventory", label: "Stock", icon: Boxes },
    { to: "/dashboard/expenses", label: "Expense", icon: Receipt }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur grid grid-cols-5">
      {items.map((it) => {
        const active = pathname === it.to || pathname.startsWith(`${it.to}/`);
        return (
          <Link
            key={it.to}
            href={it.to}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${
            active ? "text-primary" : "text-muted-foreground"}`
            }>
            
            <it.icon className="h-5 w-5" />
            {it.label}
          </Link>);

      })}
    </nav>);

}