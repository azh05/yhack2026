import { supabaseServer as supabase } from "@/lib/supabase-server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const CACHE_MAX_AGE_HOURS = 168;

async function queryConflictContext(country: string): Promise<string> {
  if (!supabase) {
    console.warn(
      "[ngos] Supabase not configured — skipping conflict data query",
    );
    return "";
  }

  const { data: events, error } = await supabase
    .from("conflict_events")
    .select("event_date, event_type, fatalities, admin1, notes")
    .eq("country", country)
    .order("event_date", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[ngos] Supabase conflict events lookup error:", error);
    return "";
  }

  if (!events || events.length === 0) return "";

  const totalFatalities = events.reduce((s, e) => s + (e.fatalities || 0), 0);
  const typeCounts: Record<string, number> = {};
  for (const e of events) {
    typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
  }
  const typeBreakdown = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${type} (${count})`)
    .join(", ");

  const lines = [
    `Recent ACLED data for ${country}: ${events.length} events, ${totalFatalities} total fatalities.`,
    `Event type breakdown: ${typeBreakdown}.`,
    ...events
      .slice(0, 8)
      .map(
        (e) =>
          `  [${e.event_date}] ${e.event_type} in ${e.admin1 || country}: ${e.notes || "no details"} (${e.fatalities} fatalities)`,
      ),
  ];

  return lines.join("\n");
}

interface NGO {
  name: string;
  focus: string;
  url: string;
  reason: string;
}

const FALLBACK_NGOS: NGO[] = [
  {
    name: "International Committee of the Red Cross",
    focus: "Humanitarian Protection",
    url: "https://www.icrc.org",
    reason:
      "Provides protection and assistance to people affected by armed conflict.",
  },
  {
    name: "Doctors Without Borders",
    focus: "Medical Relief",
    url: "https://www.msf.org",
    reason:
      "Delivers emergency medical care in conflict zones with high civilian casualties.",
  },
  {
    name: "UNHCR",
    focus: "Refugee Support",
    url: "https://www.unhcr.org",
    reason:
      "Supports refugees and internally displaced populations fleeing armed conflict.",
  },
];

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get("country");
  if (!country) {
    return NextResponse.json({ error: "Missing country" }, { status: 400 });
  }

  // Optional context passed from the frontend
  const eventType = req.nextUrl.searchParams.get("eventType") || "";
  const fatalities = req.nextUrl.searchParams.get("fatalities") || "";
  const severity = req.nextUrl.searchParams.get("severity") || "";
  const humanitarianImpact =
    req.nextUrl.searchParams.get("humanitarianImpact") || "";

  try {
    // Check cache in ngos table (only if Supabase is available)
    if (supabase) {
      const cacheThreshold = new Date(
        Date.now() - CACHE_MAX_AGE_HOURS * 60 * 60 * 1000,
      ).toISOString();
      const { data: cachedRows, error: cacheError } = await supabase
        .from("ngos")
        .select("*")
        .eq("country", country)
        .gte("updated_at", cacheThreshold)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (cacheError) {
        console.error("[ngos] Supabase cache lookup error:", cacheError);
      }

      const cached = cachedRows?.[0] ?? null;

      if (cached && cached.ngos_json) {
        return NextResponse.json({
          ngos: cached.ngos_json,
          cached: true,
        });
      }
    } else {
      console.warn("[ngos] Supabase not configured — skipping cache lookup");
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("[ngos] GEMINI_API_KEY is not set");
      return NextResponse.json(
        { error: "AI service is not configured", ngos: null },
        { status: 503 },
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Fetch ACLED conflict events for real context
    const acledContext = await queryConflictContext(country);

    // Build context section from all available sources
    let contextSection = "";
    if (acledContext) {
      contextSection += `${acledContext}\n\n`;
    }
    if (eventType) {
      contextSection += `Primary event type: ${eventType}.\n`;
    }
    if (fatalities) {
      contextSection += `Fatalities in the last 30 days: ${fatalities}.\n`;
    }
    if (severity) {
      contextSection += `Current severity index: ${severity}/10.\n`;
    }
    if (humanitarianImpact) {
      contextSection += `Humanitarian situation: ${humanitarianImpact}\n`;
    }
    if (!contextSection) {
      contextSection =
        "No recent event data available. Use your general knowledge about this country's conflict situation.\n";
    }

    const prompt = `You are an expert geopolitical data analyst and humanitarian coordinator. Given the conflict zone "${country}" and the conflict data below, select 2 to 3 NGOs that are the best match for the specific humanitarian needs in this crisis.

You MUST select from the reference pool below. Choose ONLY organizations whose specialization directly addresses what the conflict data describes. Do not pick generalist organizations unless the data specifically warrants it.

Reference pool by specialization:
- Medical/surgical trauma: Doctors Without Borders (msf.org), International Medical Corps (internationalmedicalcorps.org), Emergency (emergency.it)
- Refugee camps and displacement: UNHCR (unhcr.org), International Rescue Committee (rescue.org), Norwegian Refugee Council (nrc.no)
- Food insecurity and famine: World Food Programme (wfp.org), World Central Kitchen (wck.org), Action Against Hunger (actionagainsthunger.org)
- Child protection and education: UNICEF (unicef.org), Save the Children (savethechildren.org), War Child (warchild.org)
- Landmines and unexploded ordnance: HALO Trust (halotrust.org), Mines Advisory Group (maginternational.org)
- Shelter and infrastructure: Habitat for Humanity (habitat.org), ShelterBox (shelterbox.org)
- Water, sanitation, hygiene: WaterAid (wateraid.org), Oxfam (oxfam.org)
- Legal protection and human rights: Amnesty International (amnesty.org), Human Rights Watch (hrw.org)
- General humanitarian coordination: International Committee of the Red Cross (icrc.org), OCHA/CERF (unocha.org)

Selection rules:
1. Read the conflict data carefully. Identify the dominant humanitarian needs (mass casualties? displacement? food crisis? child soldiers? landmines?).
2. Pick organizations whose specialization directly matches those needs.
3. Do NOT pick more than one organization from the same specialization category.
4. If the conflict involves bombings or shelling with civilian casualties, prioritize surgical/trauma medical organizations over general ones.
5. If the conflict data mentions displacement or refugees, include a displacement-focused organization.

Conflict data for ${country}:
${contextSection}
You MUST wrap the JSON array inside <ngos> XML tags. Do not include any text inside the tags other than the JSON array.

Use this EXACT format:
<ngos>
[
  {
    "name": "Organization Name",
    "focus": "3-word specialization label",
    "url": "https://www.example.org",
    "reason": "One sentence explaining why this org is relevant to the data above"
  }
]
</ngos>`;

    let parsedNgos: NGO[];

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const tagMatch = text.match(/<ngos>([\s\S]*?)<\/ngos>/);
      if (!tagMatch) {
        console.error("[ngos] Could not find <ngos> tags in AI response");
        parsedNgos = FALLBACK_NGOS;
      } else {
        const rawJson = JSON.parse(tagMatch[1].trim());

        if (
          !Array.isArray(rawJson) ||
          !rawJson.every(
            (item: unknown) =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as Record<string, unknown>).name === "string" &&
              typeof (item as Record<string, unknown>).focus === "string" &&
              typeof (item as Record<string, unknown>).url === "string" &&
              typeof (item as Record<string, unknown>).reason === "string",
          )
        ) {
          console.error("[ngos] AI response JSON failed validation");
          parsedNgos = FALLBACK_NGOS;
        } else {
          parsedNgos = rawJson as NGO[];
        }
      }
    } catch (aiError) {
      console.error("[ngos] Gemini API or parsing error:", aiError);
      parsedNgos = FALLBACK_NGOS;
    }

    // Cache in ngos table — delete old then insert fresh (only if Supabase is available)
    if (supabase) {
      const { error: deleteError } = await supabase
        .from("ngos")
        .delete()
        .eq("country", country);
      if (deleteError) {
        console.error("[ngos] Supabase cache delete error:", deleteError);
      }

      const { error: insertError } = await supabase
        .from("ngos")
        .insert({ country, ngos_json: parsedNgos });
      if (insertError) {
        console.error("[ngos] Supabase cache insert error:", insertError);
      }
    }

    return NextResponse.json({ ngos: parsedNgos, cached: false });
  } catch (err) {
    console.error("[ngos] Unhandled error for country:", country, err);
    return NextResponse.json(
      { error: "Internal server error fetching NGOs", ngos: null },
      { status: 500 },
    );
  }
}
