import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ watchlist: data });
}

export async function POST(req: NextRequest) {
  const { user_id, country } = await req.json();

  if (!user_id || !country) {
    return NextResponse.json({ error: "Missing user_id or country" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("watchlist")
    .upsert({ user_id, country }, { onConflict: "user_id,country" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also update email subscriber regions
  try {
    await supabase.rpc("add_region_to_subscriber", { p_user_id: user_id, p_country: country });
  } catch {
    // RPC may not exist yet — ignore
  }

  return NextResponse.json({ item: data });
}

export async function DELETE(req: NextRequest) {
  const { user_id, country } = await req.json();

  if (!user_id || !country) {
    return NextResponse.json({ error: "Missing user_id or country" }, { status: 400 });
  }

  const { error } = await supabase
    .from("watchlist")
    .delete()
    .eq("user_id", user_id)
    .eq("country", country);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Removed from watchlist" });
}
