import { supabase } from "@/lib/supabase";
import { Resend } from "resend";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY!);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function generateDigestContent(): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a conflict intelligence analyst. Generate a brief daily conflict digest email in HTML format. Include:
- A greeting
- Top 5 escalating conflicts globally with 1-2 sentence summaries each
- Top 3 de-escalating situations
- A brief global outlook

Use clean HTML with inline styles. Keep it concise and factual. Use a dark theme (#1a1a1a background, #e5e5e5 text, red accents for escalation, green for de-escalation).`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function POST(req: NextRequest) {
  const { frequency } = await req.json();

  const targetFrequency = frequency || "daily";

  // Get active subscribers for this frequency
  const { data: subscribers, error: subError } = await supabase
    .from("email_subscribers")
    .select("email, regions")
    .eq("is_active", true)
    .eq("frequency", targetFrequency);

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ message: "No subscribers for this frequency" });
  }

  // Generate digest content
  const htmlContent = await generateDigestContent();

  // Send to all subscribers
  const results = await Promise.allSettled(
    subscribers.map((sub) =>
      resend.emails.send({
        from: "War Digest <digest@war.app>",
        to: sub.email,
        subject: `War Daily Conflict Digest — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
        html: htmlContent,
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ sent, failed, total: subscribers.length });
}
