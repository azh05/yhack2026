import { supabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

const CONFLICT_TYPES = [
  "Battles",
  "Violence against civilians",
  "Explosions/Remote violence",
  "Riots",
];

export async function GET(req: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  const params = req.nextUrl.searchParams;
  const includeAll = params.get("include_all") === "true";
  const page = parseInt(params.get("page") || "0");
  const pageSize = parseInt(params.get("page_size") || "1000");

  let query = supabaseServer
    .from("conflict_events")
    .select(
      "id, event_date, event_type, country, admin1, latitude, longitude, fatalities, severity_score",
      { count: "exact" },
    )
    .order("event_date", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (!includeAll) {
    query = query.in("event_type", CONFLICT_TYPES);
  }

  const { data, error, count: totalCount } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const countries = new Set((data || []).map((e) => e.country));

  return NextResponse.json({
    events: data || [],
    count: data?.length || 0,
    total: totalCount ?? data?.length ?? 0,
    total_countries: countries.size,
  });
}
