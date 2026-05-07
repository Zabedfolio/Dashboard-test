import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isBootstrapAdminEmail, isMissingProfilesTableError } from "@/lib/auth";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Unauthorized", status: 401 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  if (!profile && isBootstrapAdminEmail(auth.user.email)) {
    return { user: auth.user };
  }

  if (profile?.role !== "admin") return { error: "Forbidden", status: 403 };
  return { user: auth.user };
}

export async function GET(request) {
  const check = await requireAdmin();
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim();
  const admin = createAdminClient();

  let query = admin
    .from("profiles")
    .select("id, email, name, avatar, role, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (email) {
    query = query.ilike("email", `%${email}%`);
  }

  const { data, error } = await query;
  if (isMissingProfilesTableError(error)) {
    return NextResponse.json(
      {
        error: "Supabase setup incomplete: public.profiles table is missing. Run supabase/rbac.sql in the Supabase SQL editor.",
      },
      { status: 503 },
    );
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data || [] });
}

export async function PATCH(request) {
  const check = await requireAdmin();
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const { email, role } = await request.json();
  if (!email || !["admin", "moderator", "user"].includes(role)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: usersData, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const user = usersData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", user.id);

  if (isMissingProfilesTableError(error)) {
    return NextResponse.json(
      {
        error: "Supabase setup incomplete: public.profiles table is missing. Run supabase/rbac.sql in the Supabase SQL editor.",
      },
      { status: 503 },
    );
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, userId: user.id, role });
}
