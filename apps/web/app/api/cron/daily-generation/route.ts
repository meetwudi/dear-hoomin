import type { NextRequest } from "next/server";
import { runDailyGeneration } from "../../../../lib/pets/daily-generation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ success: false }, { status: 401 });
  }

  const result = await runDailyGeneration();

  return Response.json({
    success: true,
    ...result,
  });
}
