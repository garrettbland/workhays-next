import { NextResponse, type NextRequest } from "next/server";
import { connection } from "next/server";
import { runDaily } from "@/lib/cron";

export const maxDuration = 300;

/** Vercel Cron calls this once a day with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: NextRequest) {
  await connection();
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runDaily();
    console.info("[cron] daily", JSON.stringify(result));
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[cron] daily failed", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
