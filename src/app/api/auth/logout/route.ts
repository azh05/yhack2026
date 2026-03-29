import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST() {
  if (!supabaseServer) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  const { error } = await supabaseServer.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Logged out" });
}
