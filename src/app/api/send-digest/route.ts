import { supabaseServer as supabase } from "@/lib/supabase-server";
import { Resend } from "resend";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

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
    if (title && link)
      articles.push({
        title: title.trim(),
        url: link.trim(),
        source: source.trim(),
        pubDate: pubDate.trim(),
      });
  }
  return articles;
}

async function fetchNewsForCountry(country: string): Promise<NewsArticle[]> {
  try {
    const query = encodeURIComponent(`${country} conflict war`);
    const res = await fetch(
      `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
      },
    );
    const xml = await res.text();
    return parseRSSItems(xml).slice(0, 3);
  } catch {
    return [];
  }
}

async function generateDigestEmail(
  genAI: GoogleGenerativeAI,
  newsByCountry: Record<string, NewsArticle[]>,
  watchedCountries: string[],
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const newsContext = Object.entries(newsByCountry)
    .map(
      ([country, articles]) =>
        `## ${country}\n` +
        articles
          .map((a) => `- "${a.title}" (${a.source}, ${a.pubDate})\n  ${a.url}`)
          .join("\n"),
    )
    .join("\n\n");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const prompt = `You are a conflict intelligence analyst. Generate a weekly conflict digest email as HTML.

The user is watching: ${watchedCountries.join(", ")}

Here are the latest real news headlines, grouped by country:

${newsContext}

Generate ONLY the inner HTML (no <html>, <head>, or <body> tags). I will wrap it. Follow this EXACT structure — output ONLY what goes inside the wrapper:

<!-- Header with subtle crosshatch background pattern -->
<div style="position:relative; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:24px; margin-bottom:28px; background-image:url('data:image/svg+xml,<svg width=\\"40\\" height=\\"40\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M0 0l40 40M40 0L0 40\\" stroke=\\"rgba(255,255,255,0.02)\\" stroke-width=\\"1\\"/></svg>'); background-size:40px 40px;">
  <div style="font-size:11px; letter-spacing:3px; color:rgba(255,255,255,0.25); text-transform:uppercase; font-weight:600;">ConflictLens Intelligence</div>
  <h1 style="font-size:26px; font-weight:700; color:#ffffff; margin:10px 0 0; letter-spacing:-0.5px;">Weekly Conflict Digest</h1>
  <p style="font-size:13px; color:rgba(255,255,255,0.3); margin:8px 0 0;">${today} &middot; ${watchedCountries.length} countries monitored</p>
</div>

<!-- Then for EACH COUNTRY, output a country section like this: -->
<div style="margin-bottom:24px;">
  <!-- Country header with severity indicator -->
  <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.04);">
    <div style="width:10px; height:10px; border-radius:50%; background:[#ef4444 for high severity, #f97316 for moderate, #3b82f6 for low]; box-shadow:0 0 8px [same color with 40% opacity];"></div>
    <span style="font-size:15px; font-weight:700; color:#ffffff; letter-spacing:0.5px;">COUNTRY NAME</span>
    <span style="font-size:11px; color:rgba(255,255,255,0.25); font-weight:500; margin-left:auto;">[ESCALATING / PERSISTENT / DE-ESCALATING]</span>
  </div>

  <!-- 1-2 sentence AI analysis for this country -->
  <p style="font-size:13px; color:rgba(255,255,255,0.55); line-height:1.6; margin:0 0 12px; padding-left:20px; border-left:2px solid rgba(255,255,255,0.06);">Brief AI analysis of the situation in this country based on the headlines.</p>

  <!-- Story cards for this country -->
  <div style="background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:14px 16px; margin-bottom:8px;">
    <p style="font-size:13px; color:rgba(255,255,255,0.75); line-height:1.5; margin:0 0 6px;">Headline summary text</p>
    <div style="display:flex; align-items:center; gap:8px;">
      <span style="font-size:11px; color:rgba(255,255,255,0.3);">Source Name</span>
      <span style="font-size:11px; color:rgba(255,255,255,0.15);">&middot;</span>
      <a href="[url]" style="font-size:11px; color:#60a5fa; text-decoration:none;">Read article &rarr;</a>
    </div>
  </div>
  <!-- Repeat for each story in this country -->
</div>
<!-- Repeat for each country -->

<!-- Divider with dot pattern -->
<div style="height:1px; background-image:url('data:image/svg+xml,<svg width=\\"8\\" height=\\"1\\" xmlns=\\"http://www.w3.org/2000/svg\\"><circle cx=\\"4\\" cy=\\"0.5\\" r=\\"0.5\\" fill=\\"rgba(255,255,255,0.15)\\"/></svg>'); background-repeat:repeat-x; margin:28px 0;"></div>

<!-- Global outlook -->
<p style="font-size:14px; color:rgba(255,255,255,0.5); line-height:1.6; margin:0 0 24px; text-align:center; font-style:italic;">[1-2 sentence global outlook across all watched conflicts]</p>

<!-- Footer -->
<div style="text-align:center; padding-top:16px;">
  <p style="font-size:11px; color:rgba(255,255,255,0.15); margin:0;">Generated by ConflictLens &middot; ACLED + GDELT data &middot; Powered by Gemini AI</p>
</div>

Rules:
- GROUP stories by country — all stories for one country go under that country's section
- Order countries by severity (most severe first)
- For each country: severity dot + country name + trend label + 1-2 line AI summary + story cards
- Use #ef4444 for high severity (active war), #f97316 for moderate, #3b82f6 for lower/watchlist
- Include real article URLs as "Read article →" links
- Use the EXACT source name from the RSS data
- Output ONLY the HTML content, no markdown fences or explanation`;

  const result = await model.generateContent(prompt);
  const inner = result.response.text().replace(/```html?|```/g, "").trim();

  return `<div style="background:#0a0e17; padding:0; margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; min-height:100vh;">
  <div style="max-width:600px; margin:0 auto; padding:40px 28px; background-image:url('data:image/svg+xml,<svg width=&quot;100&quot; height=&quot;100&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;><circle cx=&quot;50&quot; cy=&quot;50&quot; r=&quot;1&quot; fill=&quot;rgba(255,255,255,0.015)&quot;/></svg>'); background-size:100px 100px;">
    ${inner}
  </div>
</div>`;
}

export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured — cannot send digests" },
      { status: 503 },
    );
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not configured" },
      { status: 503 },
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

      if (sub.user_id && supabase) {
        const { data: watchlist } = await supabase
          .from("watchlist")
          .select("country")
          .eq("user_id", sub.user_id);
        watchedCountries = (watchlist || []).map((w) => w.country);
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
        }),
      );

      const htmlContent = await generateDigestEmail(
        genAI,
        newsByCountry,
        watchedCountries,
      );

      return resend.emails.send({
        from: "War Digest <onboarding@resend.dev>",
        to: sub.email,
        subject: `War Weekly Digest — ${dateRange}${watchedCountries.length > 0 ? ` · ${watchedCountries.slice(0, 2).join(", ")}` : ""}`,
        html: htmlContent,
      });
    }),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ sent, failed, total: subscribers.length });
}
