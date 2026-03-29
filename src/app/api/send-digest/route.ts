import { supabaseServer as supabase } from "@/lib/supabase-server";
import { Resend } from "resend";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY!);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface NewsArticle {
  title: string;
  source: string;
  url: string;
  pubDate: string;
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
    if (title && link) articles.push({ title: title.trim(), url: link.trim(), source: source.trim(), pubDate: pubDate.trim() });
  }
  return articles;
}

async function fetchNewsForCountry(country: string): Promise<NewsArticle[]> {
  try {
    const query = encodeURIComponent(`${country} conflict war`);
    const res = await fetch(`https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const xml = await res.text();
    return parseRSSItems(xml).slice(0, 3);
  } catch {
    return [];
  }
}

async function generateDigestEmail(newsByCountry: Record<string, NewsArticle[]>, watchedCountries: string[]): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const newsContext = Object.entries(newsByCountry)
    .map(([country, articles]) =>
      `## ${country}\n` + articles.map(a => `- "${a.title}" (${a.source}, ${a.pubDate})\n  ${a.url}`).join("\n")
    ).join("\n\n");

  const prompt = `You are a conflict intelligence analyst. Generate a weekly conflict digest email in HTML format.

The user is watching: ${watchedCountries.join(", ")}

Here are the latest real news headlines for their watched countries:

${newsContext}

Generate an HTML email:
- Pick the 8 most important/escalating stories across all countries
- For each: country name in bold, then 1 sentence summary, then "Read more →" link to source
- If the country is in the user's watchlist, put a 👁️ emoji before the country name
- Group by country if multiple from same country
- Start with "Latest Escalations — [today's date]"
- After the header, show a small line: "Your watchlist: [list of watched countries]"
- End with a 1-line global outlook sentence

Format:
- Clean HTML with inline styles only
- Dark theme: background #1a1a1a, text #e5e5e5, links in #60a5fa
- Red (#ef4444) accents for high-severity, yellow (#facc15) for moderate
- Watchlist countries should have a subtle left border in #3b82f6 (blue)
- Keep it scannable`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function POST(req: NextRequest) {
  const { frequency } = await req.json();
  const targetFrequency = frequency || "daily";

  const { data: subscribers, error: subError } = await supabase
    .from("email_subscribers")
    .select("email, user_id")
    .eq("is_active", true)
    .eq("frequency", targetFrequency);

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ message: "No subscribers for this frequency" });
  }

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const dateRange = `${weekAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const results = await Promise.allSettled(
    subscribers.map(async (sub) => {
      let watchedCountries: string[] = [];

      if (sub.user_id) {
        const { data: watchlist } = await supabase
          .from("watchlist")
          .select("country")
          .eq("user_id", sub.user_id);
        watchedCountries = (watchlist || []).map(w => w.country);
      }

      // Default countries if no watchlist
      if (watchedCountries.length === 0) {
        watchedCountries = ["Ukraine", "Sudan", "Palestine", "Myanmar"];
      }

      // Fetch latest news for each watched country
      const newsByCountry: Record<string, NewsArticle[]> = {};
      await Promise.all(
        watchedCountries.slice(0, 6).map(async (country) => {
          newsByCountry[country] = await fetchNewsForCountry(country);
        })
      );

      const htmlContent = await generateDigestEmail(newsByCountry, watchedCountries);

      return resend.emails.send({
        from: "War Digest <onboarding@resend.dev>",
        to: sub.email,
        subject: `War Weekly Digest — ${dateRange}${watchedCountries.length > 0 ? ` · ${watchedCountries.slice(0, 2).join(", ")}` : ""}`,
        html: htmlContent,
      });
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ sent, failed, total: subscribers.length });
}
