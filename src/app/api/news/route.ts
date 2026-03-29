import { supabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

interface NewsArticle {
  url: string;
  title: string;
  source: string;
  pub_date: string;
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
        url: link.trim(),
        title: title.trim(),
        source: source.trim(),
        pub_date: pubDate.trim(),
      });
    }
  }

  return articles;
}

/**
 * Format a Date (or ISO string) as YYYY-MM-DD which is the format
 * Google News search operators `before:` and `after:` expect.
 */
function toGoogleDateString(input: string): string {
  const d = new Date(input);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const CACHE_MAX_AGE_HOURS = 6;

export async function GET(req: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  const params = req.nextUrl.searchParams;
  const country = params.get("country");
  const keyword = params.get("keyword") || "conflict";
  const limit = parseInt(params.get("limit") || "10");
  const before = params.get("before"); // ISO date string or YYYY-MM-DD
  const after = params.get("after"); // ISO date string or YYYY-MM-DD

  if (!country) {
    return NextResponse.json(
      { error: "Missing 'country' parameter" },
      { status: 400 },
    );
  }

  // Build the cache key suffix so date-scoped queries are cached separately
  const dateCacheKey = [after, before].filter(Boolean).join("_") || "latest";

  // Check cache first
  const cacheThreshold = new Date(
    Date.now() - CACHE_MAX_AGE_HOURS * 60 * 60 * 1000,
  ).toISOString();

  let cacheQuery = supabaseServer
    .from("news_articles")
    .select("*")
    .eq("country", country)
    .eq("keyword", keyword)
    .gte("fetched_at", cacheThreshold)
    .order("pub_date", { ascending: false })
    .limit(limit);

  // When date-scoped, also filter cached rows by the requested window
  if (after) {
    const afterDate = toGoogleDateString(after);
    if (afterDate) {
      cacheQuery = cacheQuery.gte(
        "pub_date",
        new Date(afterDate).toISOString(),
      );
    }
  }
  if (before) {
    const beforeDate = toGoogleDateString(before);
    if (beforeDate) {
      cacheQuery = cacheQuery.lte(
        "pub_date",
        new Date(beforeDate).toISOString(),
      );
    }
  }

  const { data: cached } = await cacheQuery;

  if (cached && cached.length > 0) {
    return NextResponse.json({
      country,
      keyword,
      articles: cached,
      cached: true,
    });
  }

  // Build Google News RSS search query with date operators.
  // Google News search supports `before:YYYY-MM-DD` and `after:YYYY-MM-DD`
  // to restrict results to a specific date window.
  let searchTerms = `${country} ${keyword}`;

  if (after) {
    const formatted = toGoogleDateString(after);
    if (formatted) searchTerms += ` after:${formatted}`;
  }
  if (before) {
    const formatted = toGoogleDateString(before);
    if (formatted) searchTerms += ` before:${formatted}`;
  }

  const query = encodeURIComponent(searchTerms);
  const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const res = await fetch(rssUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const xml = await res.text();
    const articles = parseRSSItems(xml).slice(0, limit);

    // Cache in Supabase (fire and forget)
    if (articles.length > 0) {
      const rows = articles.map((a) => ({
        country,
        keyword,
        url: a.url,
        title: a.title,
        source: a.source,
        pub_date: a.pub_date ? new Date(a.pub_date).toISOString() : null,
      }));

      supabaseServer
        .from("news_articles")
        .upsert(rows, { onConflict: "country,url" })
        .then(() => {});
    }

    return NextResponse.json({ country, keyword, articles, cached: false });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 502 },
    );
  }
}
