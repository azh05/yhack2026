import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Logged out" });
}
