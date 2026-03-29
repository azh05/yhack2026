import { supabase } from "@/lib/supabase";
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
    const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1") || "";
    const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
    const source = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1") || "";

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

const CACHE_MAX_AGE_HOURS = 6;

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const country = params.get("country");
  const keyword = params.get("keyword") || "conflict";
  const limit = parseInt(params.get("limit") || "10");

  if (!country) {
    return NextResponse.json({ error: "Missing 'country' parameter" }, { status: 400 });
  }

  // Check cache first
  const cacheThreshold = new Date(Date.now() - CACHE_MAX_AGE_HOURS * 60 * 60 * 1000).toISOString();
  const { data: cached } = await supabase
    .from("news_articles")
    .select("*")
    .eq("country", country)
    .eq("keyword", keyword)
    .gte("fetched_at", cacheThreshold)
    .order("pub_date", { ascending: false })
    .limit(limit);

  if (cached && cached.length > 0) {
    return NextResponse.json({ country, keyword, articles: cached, cached: true });
  }

  // Fetch fresh from Google News RSS
  const query = encodeURIComponent(`${country} ${keyword}`);
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

      supabase
        .from("news_articles")
        .upsert(rows, { onConflict: "country,url" })
        .then(() => {});
    }

    return NextResponse.json({ country, keyword, articles, cached: false });
  } catch {
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 502 });
  }
}
