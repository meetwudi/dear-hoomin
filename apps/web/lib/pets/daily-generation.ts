import { generateDailyThoughtImageForCron } from "./generation";
import { cronLogger } from "../observability/logger";
import {
  createMissingDailyThoughtsForTargets,
  listDailyGenerationCandidates,
  listTargetsDueForDailyGeneration,
  type DailyGenerationTarget,
} from "./store";
import {
  isDailyThoughtGenerationHour,
  resolveTimeContextForTimeZone,
} from "../user-context/timezone";

const dailyGenerationLimit = 5;
const dailyGenerationHour = 6;

type DailyGenerationMode = "scheduled" | "current_local_date";

function getDueTargets(
  instant: Date,
  candidates: {
    pet_id: string;
    hoomin_id: string;
    time_zone: string | null;
  }[],
  mode: DailyGenerationMode,
) {
  const targetsByKey = new Map<string, DailyGenerationTarget>();

  for (const candidate of candidates) {
    const timeContext = resolveTimeContextForTimeZone({
      hoominId: candidate.hoomin_id,
      timeZone: candidate.time_zone,
      instant,
    });

    if (mode === "scheduled" && !isDailyThoughtGenerationHour(timeContext)) {
      continue;
    }

    const target = {
      petId: candidate.pet_id,
      localDate: timeContext.localDate,
    };

    targetsByKey.set(`${target.petId}:${target.localDate}`, target);
  }

  return [...targetsByKey.values()];
}

export async function runDailyGeneration({
  mode = "scheduled",
}: {
  mode?: DailyGenerationMode;
} = {}) {
  const instant = new Date();
  const limit = dailyGenerationLimit;
  const log = cronLogger({
    job: "daily_generation",
    mode,
  });

  log.info(
    {
      instant: instant.toISOString(),
      generationHour: dailyGenerationHour,
      limit,
    },
    "daily_generation_started",
  );

  const candidates = await listDailyGenerationCandidates();
  const targets = getDueTargets(instant, candidates, mode);

  log.info(
    {
      candidateCount: candidates.length,
      targetCount: targets.length,
      skippedCount: candidates.length - targets.length,
    },
    "daily_generation_targets_resolved",
  );

  await createMissingDailyThoughtsForTargets(targets);

  const dueTargets = await listTargetsDueForDailyGeneration({
    targets,
    limit,
  });
  const results = [];

  for (const target of dueTargets) {
    const result = await generateDailyThoughtImageForCron(
      target.petId,
      target.localDate,
    );
    results.push({
      petId: target.petId,
      localDate: target.localDate,
      status: result.status,
    });
  }

  log.info(
    {
      dueCount: dueTargets.length,
      attempted: results.length,
      succeeded: results.filter((result) => result.status === "succeeded").length,
      failed: results.filter((result) => result.status !== "succeeded").length,
    },
    "daily_generation_finished",
  );

  return {
    mode,
    generationHour: dailyGenerationHour,
    limit,
    candidateCount: candidates.length,
    targetCount: targets.length,
    dueCount: dueTargets.length,
    attempted: results.length,
    results,
  };
}
