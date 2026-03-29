import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const CONFLICT_TYPES = ["Battles", "Violence against civilians", "Explosions/Remote violence", "Riots"];

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const includeAll = params.get("include_all") === "true";
  const page = parseInt(params.get("page") || "0");
  const pageSize = parseInt(params.get("page_size") || "1000");

  let query = supabase
    .from("conflict_events")
    .select("id, event_date, event_type, country, admin1, latitude, longitude, fatalities, severity_score")
    .order("event_date", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (!includeAll) {
    query = query.in("event_type", CONFLICT_TYPES);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data || [], count: data?.length || 0 });
}
