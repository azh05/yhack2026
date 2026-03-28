import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const country = params.get("country");
  const eventType = params.get("event_type");
  const startDate = params.get("start_date");
  const endDate = params.get("end_date");
  const minFatalities = params.get("min_fatalities");
  const limit = parseInt(params.get("limit") || "1000");
  const offset = parseInt(params.get("offset") || "0");

  let query = supabase
    .from("conflict_events")
    .select("*")
    .order("event_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (country) {
    query = query.ilike("country", country);
  }

  if (eventType) {
    query = query.eq("event_type", eventType);
  }

  if (startDate) {
    query = query.gte("event_date", startDate);
  }

  if (endDate) {
    query = query.lte("event_date", endDate);
  }

  if (minFatalities) {
    query = query.gte("fatalities", parseInt(minFatalities));
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data, count: data?.length || 0 });
}
