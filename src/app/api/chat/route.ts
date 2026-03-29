import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseServer as supabase } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

async function geocode(
  placeName: string,
  mapboxToken: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(placeName)}.json?access_token=${mapboxToken}&limit=1&types=country,region,place,locality`,
    );
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
  } catch {}
  return null;
}

async function queryConflictData(countries: string[]): Promise<string> {
  if (countries.length === 0) return "";
  if (!supabase) {
    console.warn(
      "[chat] Supabase not configured — skipping conflict data query",
    );
    return "";
  }

  const results: string[] = [];

  for (const country of countries.slice(0, 5)) {
    const { data: events } = await supabase
      .from("conflict_events")
      .select(
        "event_date, event_type, admin1, fatalities, severity_score, notes",
      )
      .ilike("country", country)
      .gt("fatalities", 0)
      .order("event_date", { ascending: false })
      .limit(10);

    if (events && events.length > 0) {
      const totalFat = events.reduce((s, e) => s + e.fatalities, 0);
      const avgSev = (
        events.reduce((s, e) => s + (e.severity_score || 0), 0) / events.length
      ).toFixed(1);
      results.push(
        `${country}: ${events.length} recent violent events, ${totalFat} fatalities, avg severity ${avgSev}`,
      );
      results.push(
        events
          .slice(0, 5)
          .map(
            (e) =>
              `  [${e.event_date}] ${e.event_type} in ${e.admin1 || country}: ${e.fatalities} fatalities`,
          )
          .join("\n"),
      );
    } else {
      results.push(`${country}: No recent violent events found in database`);
    }
  }

  return results.join("\n");
}

export async function POST(req: NextRequest) {
  const { message, history } = await req.json();

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "Missing 'message' field" },
      { status: 400 },
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Step 1: Ask the model what countries are relevant to the query
  const extractResult = await model.generateContent(
    `Extract the country names mentioned or implied in this user query about conflicts. Return ONLY a JSON array of country names, nothing else. If no specific country, return the 5 most relevant conflict countries for the topic.\n\nQuery: "${message}"`,
  );

  let countries: string[] = [];
  try {
    const raw = extractResult.response
      .text()
      .replace(/```json?|```/g, "")
      .trim();
    countries = JSON.parse(raw);
  } catch {
    countries = ["Ukraine", "Sudan", "Palestine", "Syria", "Myanmar"];
  }

  // Step 2: Fetch data for those countries
  const conflictData = await queryConflictData(countries);

  // Step 3: Generate response with the targeted data
  const systemPrompt = `You are Mars, a conflict intelligence assistant on an interactive 3D globe platform. You have access to ACLED conflict event data.

Use your own knowledge about global conflicts PLUS the database data below to answer questions. If the database doesn't have data for a country, use your general knowledge — don't say "I don't have data."

Database results for relevant countries:
${conflictData || "No specific data queried."}

Capabilities:
- Answer questions about conflicts, causes, actors, humanitarian impact
- Assess travel safety
- Compare conflicts across countries
- Navigate the map: if the user wants to see a location, include on its own line: {"action":"flyTo","place":"PlaceName"}

Keep responses concise (2-4 paragraphs). Be factual and neutral.`;

  const chatHistory = (history || []).map(
    (msg: { role: string; text: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.text }],
    }),
  );

  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: systemPrompt }] },
      {
        role: "model",
        parts: [
          {
            text: "Understood. I'm Mars with access to ACLED data and general conflict knowledge. I can answer questions and navigate the globe.",
          },
        ],
      },
      ...chatHistory,
    ],
  });

  const result = await chat.sendMessage(message);
  const response = result.response.text();

  // Extract flyTo command
  let mapCommand = null;
  const cmdMatch = response.match(/\{"action":"flyTo","place":"([^"]+)"\}/);
  if (cmdMatch) {
    const placeName = cmdMatch[1];
    const coords = await geocode(placeName, MAPBOX_TOKEN);
    if (coords) {
      mapCommand = {
        action: "flyTo",
        country: placeName,
        lat: coords.lat,
        lng: coords.lng,
      };
    }
  }

  const cleanResponse = response
    .replace(/\{"action":"flyTo".*?\}\n?/g, "")
    .trim();

  return NextResponse.json({ response: cleanResponse, mapCommand });
}
