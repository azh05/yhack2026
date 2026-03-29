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

  const prompt = `You are a conflict intelligence analyst. Generate a weekly conflict digest email as HTML using a TIMELINE design.

The user is watching: ${watchedCountries.join(", ")}

Here are the latest real news headlines, grouped by country:

${newsContext}

Generate ONLY the inner HTML (no <html>, <head>, or <body> tags). I will wrap it. Follow this EXACT structure — output ONLY what goes inside the wrapper:

The design uses a single table with a continuous red border-left on the left column to create a timeline effect. NO position:absolute — email clients don't support it. Use border-left on td cells for the vertical line.

<!-- Header (OUTSIDE the timeline table) -->
<div style="padding-bottom:28px; margin-bottom:0;">
  <div style="font-size:11px; letter-spacing:3px; color:rgba(255,255,255,0.25); text-transform:uppercase; font-weight:600;">&#10084; Love Over War</div>
  <h1 style="font-size:26px; font-weight:700; color:#ffffff; margin:10px 0 0; letter-spacing:-0.5px;">Weekly Conflict Digest</h1>
  <p style="font-size:13px; color:rgba(255,255,255,0.3); margin:8px 0 0;">${today} &middot; ${watchedCountries.length} countries monitored</p>
</div>

<!-- ONE single table for the entire timeline. The left td has border-left:2px solid #dc2626 on EVERY row to create the continuous vertical line. -->
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">

  <!-- For EACH COUNTRY: -->

  <!-- Country header row -->
  <tr>
    <td width="2" style="border-left:2px solid #dc2626; padding:0; width:2px;"></td>
    <td style="padding:20px 0 4px 18px;">
      <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:#dc2626; vertical-align:middle; margin-right:10px;"></span>
      <span style="font-size:16px; font-weight:700; color:#ffffff; letter-spacing:0.5px; vertical-align:middle;">COUNTRY NAME</span>
      <span style="font-size:11px; color:rgba(255,255,255,0.3); font-weight:500; margin-left:10px; vertical-align:middle;">[ESCALATING / PERSISTENT / DE-ESCALATING]</span>
    </td>
  </tr>

  <!-- AI analysis row -->
  <tr>
    <td style="border-left:2px solid #dc2626; padding:0; width:2px;"></td>
    <td style="padding:6px 0 10px 18px;">
      <p style="font-size:13px; color:rgba(255,255,255,0.5); line-height:1.6; margin:0;">Brief AI analysis of the situation.</p>
    </td>
  </tr>

  <!-- For EACH STORY: a row with a small horizontal branch -->
  <tr>
    <td style="border-left:2px solid #dc2626; padding:0; width:2px;"></td>
    <td style="padding:6px 0 6px 0;">
      <!-- Horizontal branch line + content -->
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td style="width:18px; padding:0; vertical-align:top; padding-top:7px;">
            <div style="width:18px; height:2px; background:#dc2626;"></div>
          </td>
          <td style="padding:0 0 0 6px; vertical-align:top;">
            <p style="font-size:13px; color:rgba(255,255,255,0.75); line-height:1.4; margin:0 0 3px;">Headline text</p>
            <span style="font-size:11px; color:rgba(255,255,255,0.3);">Source</span>
            <span style="font-size:11px; color:rgba(255,255,255,0.15);"> &middot; </span>
            <a href="[url]" style="font-size:11px; color:#f87171; text-decoration:none;">Read &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <!-- Repeat story rows -->

  <!-- Spacer row between countries -->
  <tr>
    <td style="border-left:2px solid #dc2626; padding:0; width:2px;"></td>
    <td style="padding:8px 0;"></td>
  </tr>

  <!-- Repeat for each country -->

  <!-- Final row: global outlook (no more border-left after this) -->
  <tr>
    <td style="padding:0; width:2px;"></td>
    <td style="padding:12px 0 0 18px;">
      <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:rgba(220,38,38,0.3); border:2px solid #dc2626; vertical-align:middle; margin-right:10px;"></span>
      <span style="font-size:13px; color:rgba(255,255,255,0.4); font-style:italic; vertical-align:middle;">[1-2 sentence global outlook]</span>
    </td>
  </tr>
</table>

<!-- Footer -->
<div style="text-align:center; padding-top:28px; margin-top:20px; border-top:1px solid rgba(255,255,255,0.04);">
  <p style="font-size:11px; color:rgba(255,255,255,0.15); margin:0;">&#10084; Love Over War &middot; ACLED + GDELT data &middot; Powered by Gemini AI</p>
</div>

Rules:
- Use ONE single <table> for the entire timeline — do NOT use multiple tables
- EVERY row except the last must have border-left:2px solid #dc2626 on the first td — this creates the continuous vertical red line
- The last row (global outlook) has NO border-left so the line terminates
- Country headers: include a 12px red circle dot inline before the country name
- Each story: use a nested table with a horizontal red line (18px wide, 2px tall div) branching from the left border to the content
- Do NOT use position:absolute or position:relative — these do not work in email clients
- GROUP stories by country, order countries by severity (most severe first)
- Link color: #f87171
- Include real article URLs as "Read →" links
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

export async function GET() {
  // Vercel cron jobs hit GET — delegate to the same logic with "daily" frequency
  const fakeReq = new NextRequest("http://localhost/api/send-digest", {
    method: "POST",
    body: JSON.stringify({ frequency: "daily" }),
    headers: { "Content-Type": "application/json" },
  });
  return POST(fakeReq);
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
        from: "Love Over War <digest@planethealth.earth>",
        to: sub.email,
        subject: `❤ Love Over War Digest — ${dateRange}${watchedCountries.length > 0 ? ` · ${watchedCountries.slice(0, 2).join(", ")}` : ""}`,
        html: htmlContent,
      });
    }),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ sent, failed, total: subscribers.length });
}
