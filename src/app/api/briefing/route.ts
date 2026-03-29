import { supabaseServer as supabase } from "@/lib/supabase-server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const CACHE_MAX_AGE_HOURS = 24;

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get("country");
  if (!country) {
    return NextResponse.json({ error: "Missing country" }, { status: 400 });
  }

  // Check cache in ai_blurbs table
  const cacheThreshold = new Date(Date.now() - CACHE_MAX_AGE_HOURS * 60 * 60 * 1000).toISOString();
  const { data: cachedRows } = await supabase
    .from("ai_blurbs")
    .select("*")
    .eq("country", country)
    .gte("created_at", cacheThreshold)
    .order("created_at", { ascending: false })
    .limit(1);
  const cached = cachedRows?.[0] ?? null;

  if (cached && cached.blurb_text) {
    // Parse the cached blurb text back into structured briefing
    const summary = cached.blurb_text;
    const extract = (label: string, nextLabels: string[]): string => {
      const start = summary.indexOf(`**${label}:**`);
      if (start === -1) return "";
      const contentStart = start + `**${label}:**`.length;
      let end = summary.length;
      for (const nl of nextLabels) {
        const idx = summary.indexOf(`**${nl}:**`, contentStart);
        if (idx !== -1 && idx < end) end = idx;
      }
      return summary.slice(contentStart, end).trim();
    };
    const labels = ["Background", "Current Situation", "Key Actors", "Humanitarian Impact", "Outlook"];
    return NextResponse.json({
      briefing: {
        country,
        background: extract("Background", labels.slice(1)),
        current_situation: extract("Current Situation", labels.slice(2)),
        humanitarian_impact: extract("Humanitarian Impact", labels.slice(4)),
        outlook: extract("Outlook", []),
        key_actors: extract("Key Actors", labels.slice(3)).split(",").map(s => s.trim()).filter(Boolean),
      },
      cached: true,
    });
  }

  // Fetch recent events for context
  const { data: events } = await supabase
    .from("conflict_events")
    .select("event_date, event_type, fatalities, admin1, notes")
    .eq("country", country)
    .order("event_date", { ascending: false })
    .limit(30);

  const context = (events || [])
    .map(e => `[${e.event_date}] ${e.event_type} in ${e.admin1 || country}: ${e.notes || ""} (${e.fatalities} fatalities)`)
    .join("\n");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a conflict intelligence analyst. Based on the following recent ACLED conflict data for ${country}, provide a structured briefing.

**Background:** Brief historical context (2-3 sentences)
**Current Situation:** What is happening now (2-3 sentences)
**Key Actors:** List the main parties involved (comma-separated names only)
**Humanitarian Impact:** Civilian toll and displacement (2-3 sentences)
**Outlook:** Near-term trajectory (1-2 sentences)

Be factual and neutral. Keep each section concise.

Recent events:
${context || "No recent event data available."}`;

  const result = await model.generateContent(prompt);
  const summary = result.response.text();

  // Parse sections
  const extract = (label: string, nextLabels: string[]): string => {
    const start = summary.indexOf(`**${label}:**`);
    if (start === -1) return "";
    const contentStart = start + `**${label}:**`.length;
    let end = summary.length;
    for (const nl of nextLabels) {
      const idx = summary.indexOf(`**${nl}:**`, contentStart);
      if (idx !== -1 && idx < end) end = idx;
    }
    return summary.slice(contentStart, end).trim();
  };

  const labels = ["Background", "Current Situation", "Key Actors", "Humanitarian Impact", "Outlook"];
  const briefing = {
    country,
    background: extract("Background", labels.slice(1)),
    current_situation: extract("Current Situation", labels.slice(2)),
    humanitarian_impact: extract("Humanitarian Impact", labels.slice(4)),
    outlook: extract("Outlook", []),
    key_actors: extract("Key Actors", labels.slice(3)).split(",").map(s => s.trim()).filter(Boolean),
    updated_at: new Date().toISOString(),
  };

  // Cache in ai_blurbs table — delete old then insert fresh
  await supabase.from("ai_blurbs").delete().eq("country", country);
  await supabase.from("ai_blurbs").insert({ country, blurb_text: summary });

  return NextResponse.json({ briefing, cached: false });
}
