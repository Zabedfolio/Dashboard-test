'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Bell, Search, LayoutDashboard, ShoppingBag, ShoppingCart, FileText, Boxes, Receipt, Package, Settings } from "lucide-react";
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
      <div className="min-h-screen flex w-full bg-muted/30 overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative">
          <header className="sticky top-0 z-30 h-14 border-b bg-background/80 backdrop-blur flex items-center gap-2 px-3 md:px-5 w-full">
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-col leading-tight min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground truncate hidden sm:block">Console</span>
              <h1 className="text-sm font-bold truncate pr-2">{title}</h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
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
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold shrink-0 border border-primary/20">
                BO
              </div>
            </div>
          </header>
          <main className="flex-1 w-full max-w-full overflow-x-hidden">
            <div className="p-3 sm:p-4 md:p-6 pb-24 sm:pb-28 md:pb-6">
              {children}
            </div>
          </main>
          <MobileBottomNav />
        </div>
      </div>
    </SidebarProvider>);
}

function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const items = [
    { to: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
    { to: "/dashboard/products", label: "Products", icon: Package },
    { to: "/dashboard", label: "Home", icon: LayoutDashboard, isCenter: true },
    { to: "/dashboard/expenses", label: "Expenses", icon: Receipt },
    { to: "/dashboard/settings", label: "Settings", icon: Settings }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur-md h-16 flex items-center justify-around px-2 pb-safe">
      {items.map((it) => {
        const active = it.to === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(it.to);
        
        if (it.isCenter) {
          return (
            <Link
              key={it.to}
              href={it.to}
              className="relative -top-6 flex flex-col items-center"
            >
              <div className={`h-14 w-14 rounded-full flex items-center justify-center shadow-2xl border-4 border-background transition-all duration-300 ${
                active ? "bg-primary text-primary-foreground scale-110" : "bg-card text-muted-foreground"
              }`}>
                <it.icon className="h-7 w-7" />
              </div>
              <span className={`text-[10px] mt-1.5 font-bold uppercase tracking-tighter ${active ? "text-primary" : "text-muted-foreground"}`}>
                Dashboard
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={it.to}
            href={it.to}
            className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <it.icon className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}