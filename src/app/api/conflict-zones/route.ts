import { NextRequest, NextResponse } from "next/server";
import http from "http";

export const dynamic = "force-dynamic";

function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

export async function GET(req: NextRequest) {
  const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
  const { searchParams } = req.nextUrl;
  const params = new URLSearchParams();
  if (searchParams.get("start_date"))
    params.set("start_date", searchParams.get("start_date")!);
  if (searchParams.get("end_date"))
    params.set("end_date", searchParams.get("end_date")!);

  const url = `${backendUrl}/api/conflict-zones?${params}`;
  console.log("[proxy] calling:", url);

  let body: string;
  try {
    body = await httpGet(url);
    console.log(
      "[proxy] got body length:",
      body.length,
      "preview:",
      body.slice(0, 80),
    );
  } catch (err: any) {
    console.error("[proxy] httpGet threw:", err?.message, err?.code);
    return NextResponse.json(
      { error: "Failed to fetch conflict zones" },
      { status: 502 },
    );
  }

  try {
    const data = JSON.parse(body);
    console.log(
      "[proxy] parsed ok, items:",
      Array.isArray(data) ? data.length : typeof data,
    );
    return NextResponse.json(data);
  } catch (err: any) {
    console.error(
      "[proxy] JSON.parse threw:",
      err?.message,
      "body was:",
      body.slice(0, 200),
    );
    return NextResponse.json(
      { error: "Failed to fetch conflict zones" },
      { status: 502 },
    );
  }
}
