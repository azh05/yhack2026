import { supabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseServer.auth.signUp({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Auto-create email subscriber entry
  if (data.user) {
    await supabaseServer
      .from("email_subscribers")
      .upsert(
        { email, user_id: data.user.id, is_active: true, frequency: "daily" },
        { onConflict: "email" },
      );
  }

  return NextResponse.json({ user: data.user, session: data.session });
}
