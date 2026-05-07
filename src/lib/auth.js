import { createAdminClient } from "@/utils/supabase/admin";

const FALLBACK_ADMIN_EMAIL = "admin@example.com";

export function getSuperAdminEmail() {
  return (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || FALLBACK_ADMIN_EMAIL).toLowerCase();
}

export function isBootstrapAdminEmail(email) {
  if (!email) return false;
  const normalized = email.toLowerCase();
  return normalized === FALLBACK_ADMIN_EMAIL || normalized === getSuperAdminEmail();
}

export function isMissingProfilesTableError(error) {
  return error?.code === "PGRST205" || error?.message?.includes("public.profiles");
}

export async function ensureUserProfile(user) {
  if (!user?.id || !user?.email) return null;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  const admin = createAdminClient();
  const email = user.email.toLowerCase();
  const name =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.display_name ||
    null;
  const avatar =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null;

  const { count, error: countError } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if (isMissingProfilesTableError(countError)) return null;
  if (countError) throw countError;

  const shouldBeAdmin = isBootstrapAdminEmail(email) || count === 0;

  const { data: existing, error: existingError } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (isMissingProfilesTableError(existingError)) return null;
  if (existingError) throw existingError;

  const profile = {
    id: user.id,
    email,
    name,
    avatar,
    role: shouldBeAdmin ? "admin" : existing?.role || "user",
  };

  if (existing) {
    const updates = {
      email,
      name: name ?? undefined,
      avatar: avatar ?? undefined,
      role: shouldBeAdmin ? "admin" : existing.role,
    };

    const { data, error } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await admin
    .from("profiles")
    .insert(profile)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
