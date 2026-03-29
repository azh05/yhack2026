import { supabaseServer as supabase } from "@/lib/supabase-server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const CACHE_MAX_AGE_HOURS = 24;

interface NewsArticle {
  title: string;
  url: string;
  source: string;
  pubDate: string;
}

function parseRSSItems(xml: string): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title =
      item
        .match(/<title>([\s\S]*?)<\/title>/)?.[1]
        ?.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1") || "";
    const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
    const source =
      item
        .match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]
        ?.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1") || "";
    if (title && link) {
      articles.push({
        title: title.trim(),
        url: link.trim(),
        source: source.trim(),
        pubDate: pubDate.trim(),
      });
    }
  }
  return articles;
}

async function fetchGoogleNews(country: string): Promise<NewsArticle[]> {
  try {
    const query = encodeURIComponent(`${country} conflict war`);
    const res = await fetch(
      `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
      },
    );
    const xml = await res.text();
    return parseRSSItems(xml).slice(0, 10);
  } catch (err) {
    console.error("[briefing] Failed to fetch Google News:", err);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get("country");
  if (!country) {
    return NextResponse.json({ error: "Missing country" }, { status: 400 });
  }

  try {
    // Check cache in ai_blurbs table (only if Supabase is available)
    let cached: Record<string, unknown> | null = null;

    if (supabase) {
      const cacheThreshold = new Date(
        Date.now() - CACHE_MAX_AGE_HOURS * 60 * 60 * 1000,
      ).toISOString();
      const { data: cachedRows, error: cacheError } = await supabase
        .from("ai_blurbs")
        .select("*")
        .eq("country", country)
        .gte("created_at", cacheThreshold)
        .order("created_at", { ascending: false })
        .limit(1);

      if (cacheError) {
        console.error("[briefing] Supabase cache lookup error:", cacheError);
      }

      cached = cachedRows?.[0] ?? null;
    } else {
      console.warn(
        "[briefing] Supabase not configured — skipping cache lookup",
      );
    }

    if (cached && (cached as Record<string, unknown>).blurb_text) {
      // Parse the cached blurb text back into structured briefing
      const summary = (cached as Record<string, unknown>).blurb_text as string;
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
      const labels = [
        "Background",
        "Current Situation",
        "Key Actors",
        "Humanitarian Impact",
        "Outlook",
      ];
      return NextResponse.json({
        briefing: {
          country,
          background: extract("Background", labels.slice(1)),
          current_situation: extract("Current Situation", labels.slice(2)),
          humanitarian_impact: extract("Humanitarian Impact", labels.slice(4)),
          outlook: extract("Outlook", []),
          key_actors: extract("Key Actors", labels.slice(3))
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
        cached: true,
      });
    }

    // Fetch recent ACLED events for context (only if Supabase is available)
    let events: Record<string, unknown>[] | null = null;

    if (supabase) {
      const { data, error: eventsError } = await supabase
        .from("conflict_events")
        .select("event_date, event_type, fatalities, admin1, notes")
        .eq("country", country)
        .order("event_date", { ascending: false })
        .limit(30);

      if (eventsError) {
        console.error("[briefing] Supabase events lookup error:", eventsError);
      }
      events = data;
    } else {
      console.warn(
        "[briefing] Supabase not configured — skipping events lookup",
      );
    }

    const acledContext = (events || [])
      .map(
        (e) =>
          `[${e.event_date}] ${e.event_type} in ${e.admin1 || country}: ${e.notes || ""} (${e.fatalities} fatalities)`,
      )
      .join("\n");

    // Always fetch Google News as supplementary real-time context
    const newsArticles = await fetchGoogleNews(country);
    const newsContext = newsArticles
      .map(
        (a) =>
          `- "${a.title}" (${a.source || "Google News"}, ${a.pubDate || "recent"})`,
      )
      .join("\n");

    if (!process.env.GEMINI_API_KEY) {
      console.error("[briefing] GEMINI_API_KEY is not set");
      return NextResponse.json(
        { error: "AI service is not configured", briefing: null },
        { status: 503 },
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build the prompt with all available context sources
    const hasAcled = acledContext.length > 0;
    const hasNews = newsContext.length > 0;

    let dataSection = "";
    if (hasAcled) {
      dataSection += `ACLED conflict event data:\n${acledContext}\n\n`;
    }
    if (hasNews) {
      dataSection += `Recent news headlines from Google News:\n${newsContext}\n\n`;
    }
    if (!hasAcled && !hasNews) {
      dataSection +=
        "No recent event data or news headlines available. Use your general knowledge about this country's conflict situation.\n\n";
    }

    const prompt = `You are a conflict intelligence analyst. Based on the following data sources for ${country}, provide a structured briefing.

**Background:** Brief historical context (2-3 sentences)
**Current Situation:** What is happening now based on the data below (2-3 sentences)
**Key Actors:** List the main parties involved (comma-separated names only)
**Humanitarian Impact:** Civilian toll and displacement (2-3 sentences)
**Outlook:** Near-term trajectory (1-2 sentences)

Be factual and neutral. Keep each section concise. Synthesize all available data sources below into a cohesive briefing. Do NOT say that data is unavailable — use news headlines and your own knowledge to fill in any gaps.

${dataSection}`;

    let summary: string;
    try {
      const result = await model.generateContent(prompt);
      summary = result.response.text();
    } catch (aiError) {
      console.error("[briefing] Gemini API error:", aiError);
      return NextResponse.json(
        { error: "AI generation failed", briefing: null },
        { status: 502 },
      );
    }

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

    const labels = [
      "Background",
      "Current Situation",
      "Key Actors",
      "Humanitarian Impact",
      "Outlook",
    ];
    const briefing = {
      country,
      background: extract("Background", labels.slice(1)),
      current_situation: extract("Current Situation", labels.slice(2)),
      humanitarian_impact: extract("Humanitarian Impact", labels.slice(4)),
      outlook: extract("Outlook", []),
      key_actors: extract("Key Actors", labels.slice(3))
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      updated_at: new Date().toISOString(),
    };

    // Cache in ai_blurbs table — delete old then insert fresh (only if Supabase is available)
    if (supabase) {
      const { error: deleteError } = await supabase
        .from("ai_blurbs")
        .delete()
        .eq("country", country);
      if (deleteError) {
        console.error("[briefing] Supabase cache delete error:", deleteError);
      }

      const { error: insertError } = await supabase
        .from("ai_blurbs")
        .insert({ country, blurb_text: summary });
      if (insertError) {
        console.error("[briefing] Supabase cache insert error:", insertError);
      }
    }

    return NextResponse.json({ briefing, cached: false });
  } catch (err) {
    console.error("[briefing] Unhandled error for country:", country, err);
    return NextResponse.json(
      { error: "Internal server error generating briefing", briefing: null },
      { status: 500 },
    );
  }
}
