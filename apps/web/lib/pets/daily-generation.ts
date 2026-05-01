import { generateDailyThoughtImageForCron } from "./generation";
import {
  createMissingDailyThoughtsForDate,
  getTodayIsoDate,
  listPetIdsDueForDailyGeneration,
} from "./store";

function getDailyGenerationLimit() {
  const parsedLimit = Number(process.env.CRON_DAILY_GENERATION_LIMIT ?? "5");

  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    return 5;
  }

  return Math.min(parsedLimit, 20);
}

export async function runDailyGeneration() {
  const localDate = getTodayIsoDate();
  const limit = getDailyGenerationLimit();

  await createMissingDailyThoughtsForDate(localDate);

  const petIds = await listPetIdsDueForDailyGeneration({
    localDate,
    limit,
  });
  const results = [];

  for (const petId of petIds) {
    const result = await generateDailyThoughtImageForCron(petId);
    results.push({ petId, status: result.status });
  }

  return {
    localDate,
    limit,
    attempted: results.length,
    results,
  };
}
