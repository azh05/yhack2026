import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const country = params.get("country");
  const eventType = params.get("event_type");
  const startDate = params.get("start_date");
  const endDate = params.get("end_date");
  const minFatalities = params.get("min_fatalities");
  const limit = Math.min(parseInt(params.get("limit") || "50000"), 50000);

  // Supabase caps at 1000 per request, so paginate
  let allEvents: any[] = [];
  let page = 0;
  const pageSize = 1000;

  while (allEvents.length < limit) {
    let query = supabase
      .from("conflict_events")
      .select("*")
      .order("event_date", { ascending: false })
      .range(page * pageSize, Math.min((page + 1) * pageSize - 1, limit - 1));

    if (country) query = query.ilike("country", country);
    if (eventType) query = query.eq("event_type", eventType);
    if (startDate) query = query.gte("event_date", startDate);
    if (endDate) query = query.lte("event_date", endDate);
    if (minFatalities) query = query.gte("fatalities", parseInt(minFatalities));

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) break;

    allEvents = allEvents.concat(data);

    if (data.length < pageSize) break;
    page++;
  }

  return NextResponse.json({ events: allEvents, count: allEvents.length });
}
