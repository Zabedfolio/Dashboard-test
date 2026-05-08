'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Package,
  Users,
  Receipt,
  Settings,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Orders", url: "/dashboard/orders", icon: ShoppingBag },
  { title: "Sales", url: "/dashboard/sales", icon: ShoppingCart },
  { title: "Invoices", url: "/dashboard/invoices", icon: FileText },
  { title: "Products", url: "/dashboard/products", icon: Package },
  { title: "Customers", url: "/dashboard/customers", icon: Users },
  { title: "Expenses", url: "/dashboard/expenses", icon: Receipt },
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
      if (
        !data &&
        auth.user.email?.toLowerCase() ===
          (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "admin@example.com").toLowerCase()
      ) {
        setRole("admin");
      }
    }
    loadRole();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const isActive = (url) => {
    if (url === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === url || pathname.startsWith(url + "/");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 px-2 py-3">
          <div className="h-8 w-8 rounded-lg bg-[#F47822] text-white grid place-items-center font-bold text-sm shrink-0">
            HL
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-gray-800">Hatkhola · Lakum</span>
              <span className="text-[11px] text-gray-400">Business Console</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="justify-between">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
              Operations
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title} className="relative">
                    {active && (
                      <span className="absolute left-0 top-0 h-full w-[3px] bg-[#F47822] z-10 rounded-r-sm" />
                    )}
                    <SidebarMenuButton asChild isActive={active}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                        {!collapsed && active && (
                          <ChevronRight className="ml-auto h-4 w-4 shrink-0" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
              Access
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {(role === "admin" || role === "moderator") && (
                <SidebarMenuItem className="relative">
                  {pathname.startsWith("/dashboard/moderator") && (
                    <span className="absolute left-0 top-0 h-full w-[3px] bg-[#F47822] z-10 rounded-r-sm" />
                  )}
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/dashboard/moderator")}
                  >
                    <Link href="/dashboard/moderator">
                      {!collapsed && <span>Moderator</span>}
                      {!collapsed && pathname.startsWith("/dashboard/moderator") && (
                        <ChevronRight className="ml-auto h-4 w-4 shrink-0" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {role === "admin" && (
                <SidebarMenuItem className="relative">
                  {pathname.startsWith("/dashboard/admin") && (
                    <span className="absolute left-0 top-0 h-full w-[3px] bg-[#F47822] z-10 rounded-r-sm" />
                  )}
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/dashboard/admin")}
                  >
                    <Link href="/dashboard/admin">
                      {!collapsed && <span>Admin</span>}
                      {!collapsed && pathname.startsWith("/dashboard/admin") && (
                        <ChevronRight className="ml-auto h-4 w-4 shrink-0" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem className="relative">
                {pathname.startsWith("/dashboard/profile") && (
                  <span className="absolute left-0 top-0 h-full w-[3px] bg-[#F47822] z-10 rounded-r-sm" />
                )}
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/profile")}
                >
                  <Link href="/dashboard/profile">
                    {!collapsed && <span>Profile</span>}
                    {!collapsed && pathname.startsWith("/dashboard/profile") && (
                      <ChevronRight className="ml-auto h-4 w-4 shrink-0" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 h-10 text-sm text-gray-500 hover:bg-[rgba(244,120,34,0.08)] hover:text-[#F47822] transition-colors"
                >
                  {!collapsed && <span>Logout</span>}
                </button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}