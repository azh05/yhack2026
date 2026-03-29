import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

async function geocode(placeName: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(placeName)}.json?access_token=${MAPBOX_TOKEN}&limit=1&types=country,region,place,locality`
    );
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
  } catch {}
  return null;
}

async function getConflictContext(): Promise<string> {
  const { data: events } = await supabase
    .from("conflict_events")
    .select("*")
    .order("event_date", { ascending: false })
    .limit(50);

  if (!events || events.length === 0) return "No conflict data available.";

  const summary = events.map(e =>
    `[${e.event_date}] ${e.event_type} in ${e.admin1 || ""}, ${e.country}: ${e.notes || ""} (${e.fatalities} fatalities, severity ${e.severity_score})`
  ).join("\n");

  const countries = [...new Set(events.map(e => e.country))];

  return `Current conflict data (${events.length} recent events across ${countries.length} countries):\n\nCountries with active conflicts: ${countries.join(", ")}\n\n${summary}`;
}

export async function POST(req: NextRequest) {
  const { message, history } = await req.json();

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Missing 'message' field" }, { status: 400 });
  }

  const conflictContext = await getConflictContext();

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const systemPrompt = `You are War AI, a conflict intelligence assistant embedded in an interactive 3D globe platform that tracks armed conflicts worldwide. You have access to real-time ACLED conflict event data.

Your capabilities:
- Answer questions about active conflicts, their causes, actors, and humanitarian impact
- Assess travel safety for specific regions
- Compare conflict severity across countries
- Explain conflict history and context
- Navigate the map: if the user wants to see a location on the map (e.g. "show me", "go to", "zoom to", "where is", or mentions a specific place they want to look at), include this JSON on its own line: {"action":"flyTo","place":"PlaceName"}
  - PlaceName should be the most specific place mentioned (city > region > country)
  - You can fly to ANY location in the world — countries, cities, regions, landmarks, etc.

Guidelines:
- Be factual, neutral, and cite specific data points from the context when possible
- Keep responses concise (2-4 paragraphs max)
- If asked about safety, always err on the side of caution
- Reference fatality counts and severity scores when relevant

${conflictContext}`;

  const chatHistory = (history || []).map((msg: { role: string; text: string }) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.text }],
  }));

  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Understood. I'm War AI, ready to help with conflict intelligence. I have access to the latest ACLED data and can navigate the globe for you. I can fly to any location worldwide." }] },
      ...chatHistory,
    ],
  });

  const result = await chat.sendMessage(message);
  const response = result.response.text();

  // Extract flyTo command if present
  let mapCommand = null;
  const cmdMatch = response.match(/\{"action":"flyTo","place":"([^"]+)"\}/);
  if (cmdMatch) {
    const placeName = cmdMatch[1];
    const coords = await geocode(placeName);
    if (coords) {
      mapCommand = { action: "flyTo", country: placeName, lat: coords.lat, lng: coords.lng };
    }
  }

  // Clean the response text (remove the JSON command from display)
  const cleanResponse = response.replace(/\{"action":"flyTo".*?\}\n?/g, "").trim();

  return NextResponse.json({ response: cleanResponse, mapCommand });
}
