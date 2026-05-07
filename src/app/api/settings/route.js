import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await request.json();

    // Validate settings object
    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
    }

    // Store settings in user metadata or a separate table
    // For now, storing in profiles table metadata column
    const { error } = await supabase
      .from("profiles")
      .update({
        settings: settings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", auth.user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Settings save error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("settings")
      .eq("id", auth.user.id)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ settings: profile?.settings || {} });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
