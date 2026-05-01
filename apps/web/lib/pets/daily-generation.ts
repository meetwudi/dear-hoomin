import { generateDailyThoughtImageForCron } from "./generation";
import {
  createMissingDailyThoughtsForDate,
  getTodayIsoDate,
  listPetIdsDueForDailyGeneration,
} from "./store";

const dailyGenerationLimit = 5;

export async function runDailyGeneration() {
  const localDate = getTodayIsoDate();
  const limit = dailyGenerationLimit;

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
