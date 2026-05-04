import type { NextRequest } from "next/server";
import { cronLogger } from "../../../../lib/observability/logger";
import { runDailyGeneration } from "../../../../lib/pets/daily-generation";

// Platform note: update harness/platform-dependencies.md when scheduled jobs change.

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const log = cronLogger({
    job: "daily_generation",
    path: request.nextUrl.pathname,
  });

  log.info({ scheduleUtc: "25 22 * * *" }, "daily_generation_cron_request_received");

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    log.warn(
      { hasCronSecret: Boolean(process.env.CRON_SECRET), hasAuthorizationHeader: Boolean(authHeader) },
      "daily_generation_cron_unauthorized",
    );
    return Response.json({ success: false }, { status: 401 });
  }

  try {
    const result = await runDailyGeneration();

    log.info(
      {
        mode: result.mode,
        candidateCount: result.candidateCount,
        targetCount: result.targetCount,
        dueCount: result.dueCount,
        attempted: result.attempted,
      },
      "daily_generation_cron_request_succeeded",
    );

    return Response.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "daily_generation_cron_failed";
    log.error({ error: message }, "daily_generation_cron_request_failed");
    return Response.json({ success: false }, { status: 500 });
  }
}
