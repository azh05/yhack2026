import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const ACLED_TOKEN_URL = "https://acleddata.com/oauth/token";
const ACLED_API_URL = "https://acleddata.com/api/acled/read";

async function getACLEDToken(): Promise<string> {
  const email = process.env.ACLED_EMAIL!;
  const password = process.env.ACLED_PASSWORD!;

  const res = await fetch(ACLED_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      username: email,
      password: password,
      grant_type: "password",
      client_id: "acled",
    }),
  });

  if (!res.ok) throw new Error(`ACLED auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function fetchACLEDPage(
  token: string,
  startDate: string,
  endDate: string,
  page: number,
): Promise<any[]> {
  const params = new URLSearchParams({
    event_date: `${startDate}|${endDate}`,
    event_date_where: "BETWEEN",
    limit: "5000",
    page: String(page),
  });

  const res = await fetch(`${ACLED_API_URL}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`ACLED API error: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

function computeSeverity(fatalities: number, eventType: string): number {
  let score = Math.min(10, 1 + Math.log2(fatalities + 1) * 1.5);
  if (eventType === "Violence against civilians") score = Math.min(10, score + 1);
  if (eventType === "Explosions/Remote violence") score = Math.min(10, score + 0.5);
  return Math.round(score * 10) / 10;
}

export async function POST(req: NextRequest) {
  const { startDate, endDate } = await req.json();

  if (!process.env.ACLED_EMAIL || !process.env.ACLED_PASSWORD) {
    return NextResponse.json({ error: "ACLED credentials not configured" }, { status: 500 });
  }

  const start = startDate || "2024-01-01";
  const end = endDate || new Date().toISOString().split("T")[0];

  let token: string;
  try {
    token = await getACLEDToken();
  } catch (err: any) {
    return NextResponse.json({ error: `Auth failed: ${err.message}` }, { status: 401 });
  }

  let totalInserted = 0;
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    let events: any[];
    try {
      events = await fetchACLEDPage(token, start, end, page);
    } catch (err: any) {
      return NextResponse.json({
        error: `Fetch failed on page ${page}: ${err.message}`,
        totalInserted,
      }, { status: 502 });
    }

    if (events.length === 0) break;

    const rows = events.map((e: any) => ({
      id: parseInt(e.event_id_cnty?.replace(/\D/g, "")) || Math.floor(Math.random() * 1000000000),
      event_date: e.event_date,
      event_type: e.event_type,
      sub_event_type: e.sub_event_type || null,
      actor1: e.actor1 || null,
      actor2: e.actor2 || null,
      country: e.country,
      admin1: e.admin1 || null,
      admin2: e.admin2 || null,
      latitude: parseFloat(e.latitude),
      longitude: parseFloat(e.longitude),
      fatalities: parseInt(e.fatalities) || 0,
      notes: e.notes || null,
      source: e.source || null,
      severity_score: computeSeverity(parseInt(e.fatalities) || 0, e.event_type),
    }));

    for (let i = 0; i < rows.length; i += 1000) {
      const batch = rows.slice(i, i + 1000);
      const { error } = await supabase
        .from("conflict_events")
        .upsert(batch, { onConflict: "id" });

      if (error) {
        console.error("Supabase upsert error:", error.message);
      } else {
        totalInserted += batch.length;
      }
    }

    hasMore = events.length >= 5000;
    page++;
  }

  return NextResponse.json({
    message: `Backfilled ${totalInserted} events from ${start} to ${end}`,
    totalInserted,
  });
}
