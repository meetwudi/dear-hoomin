import { generateDailyThoughtImageForCron } from "./generation";
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

function getDueTargets(instant: Date, candidates: {
  pet_id: string;
  hoomin_id: string;
  time_zone: string | null;
}[]) {
  const targetsByKey = new Map<string, DailyGenerationTarget>();

  for (const candidate of candidates) {
    const timeContext = resolveTimeContextForTimeZone({
      hoominId: candidate.hoomin_id,
      timeZone: candidate.time_zone,
      instant,
    });

    if (!isDailyThoughtGenerationHour(timeContext)) {
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

export async function runDailyGeneration() {
  const instant = new Date();
  const limit = dailyGenerationLimit;
  const candidates = await listDailyGenerationCandidates();
  const targets = getDueTargets(instant, candidates);

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

  return {
    generationHour: dailyGenerationHour,
    limit,
    candidateCount: candidates.length,
    dueCount: targets.length,
    attempted: results.length,
    results,
  };
}
