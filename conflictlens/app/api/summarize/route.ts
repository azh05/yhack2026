import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  const { news, sendEmail } = await req.json();

  if (!news || typeof news !== "string") {
    return NextResponse.json({ error: "Missing 'news' field" }, { status: 400 });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a conflict intelligence analyst. Given the following news content about a conflict zone, provide a structured summary in this format:

**Background:** Brief historical context (1-2 sentences)
**Current Situation:** What is happening now (2-3 sentences)
**Key Actors:** Who is involved
**Humanitarian Impact:** Civilian toll and displacement
**Outlook:** Likely near-term trajectory (1-2 sentences)

Keep the total summary under 300 words. Be factual and neutral.

News content:
${news}`;

  const result = await model.generateContent(prompt);
  const summary = result.response.text();

  let emailResult = null;

  if (sendEmail) {
    // Get active subscribers
    const { data: subscribers } = await supabase
      .from("email_subscribers")
      .select("email")
      .eq("is_active", true);

    if (subscribers && subscribers.length > 0) {
      // Convert markdown-style bold to HTML
      const htmlSummary = summary
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");

      const html = `
        <div style="font-family: sans-serif; background: #1a1a1a; color: #e5e5e5; padding: 24px; border-radius: 8px;">
          <h1 style="color: #ff4444; font-size: 20px; margin-bottom: 16px;">War — Conflict Summary</h1>
          <div style="line-height: 1.6;">${htmlSummary}</div>
          <hr style="border-color: #333; margin: 16px 0;" />
          <p style="font-size: 12px; color: #888;">You're receiving this because you subscribed to War conflict alerts.</p>
        </div>`;

      const results = await Promise.allSettled(
        subscribers.map((sub) =>
          resend.emails.send({
            from: "War <onboarding@resend.dev>",
            to: sub.email,
            subject: `War — Conflict Update`,
            html,
          })
        )
      );

      const sent = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      emailResult = { sent, failed, total: subscribers.length };
    }
  }

  return NextResponse.json({ summary, emailResult });
}
