import { DashboardLayout } from "@/components/dashboard-layout";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ensureUserProfile } from "@/lib/auth";

export default async function AppDashboardLayout({ children }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  await ensureUserProfile(data.user);

  return <DashboardLayout>{children}</DashboardLayout>;
}
