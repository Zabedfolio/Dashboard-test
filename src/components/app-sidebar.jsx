'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Package,
  Boxes,
  Users,
  Receipt,
  BarChart3,
  Settings,
  ShoppingBag } from
"lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar } from
"@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Orders", url: "/dashboard/orders", icon: ShoppingBag },
  { title: "Sales", url: "/dashboard/sales", icon: ShoppingCart },
  { title: "Invoices", url: "/dashboard/invoices", icon: FileText },
  { title: "Products", url: "/dashboard/products", icon: Package },
  { title: "Customers", url: "/dashboard/customers", icon: Users },
  { title: "Expenses", url: "/dashboard/expenses", icon: Receipt },
  { title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];


export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname() || "/";
  const supabase = createClient();
  const [role, setRole] = useState("user");

  useEffect(() => {
    async function loadRole() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .single();
      setRole(data?.role || "user");
      if (!data && auth.user.email?.toLowerCase() === (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "admin@example.com").toLowerCase()) {
        setRole("admin");
      }
    }
    loadRole();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <Link href="/" className="flex items-center gap-2 px-2 py-3">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">
            HL
          </div>
          {!collapsed &&
          <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Hatkhola · Lakum</span>
              <span className="text-[11px] text-muted-foreground">Business Console</span>
            </div>
          }
        </Link>
      </SidebarHeader>
      <SidebarContent className="justify-between">
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                item.url === "/" ?
                pathname === "/" :
                pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link href={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>);

              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Access</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(role === "admin" || role === "moderator") && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/moderator")}>
                    <Link href="/dashboard/moderator">Moderator</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/admin")}>
                    <Link href="/dashboard/admin">Admin</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/profile")}>
                  <Link href="/dashboard/profile">Profile</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                  {!collapsed && <span>Logout</span>}
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>);

}
