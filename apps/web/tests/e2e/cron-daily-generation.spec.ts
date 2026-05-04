import { expect, test } from "@playwright/test";
import {
  cleanupTestHoomin,
  closeDb,
  getDailyThoughtForPet,
  seedCronReadyPet,
} from "./support/db";

test.afterAll(async () => {
  await closeDb();
});

test("cron route generates a daily musing for a due pet", async ({ request }) => {
  const seed = await seedCronReadyPet();

  try {
    await expect.poll(() => getDailyThoughtForPet(seed.petId)).toBeNull();

    const response = await request.get("/api/cron/daily-generation", {
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.targetCount).toBeGreaterThanOrEqual(1);
    expect(body.dueCount).toBeGreaterThanOrEqual(1);
    expect(body.attempted).toBeGreaterThanOrEqual(1);
    expect(body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          petId: seed.petId,
          status: "succeeded",
        }),
      ]),
    );

    await expect.poll(() => getDailyThoughtForPet(seed.petId)).toMatchObject({
      text: "Mochi has completed a careful investigation of the snack zone.",
      image_generation_status: "succeeded",
      image_file_id: expect.any(String),
    });
  } finally {
    await cleanupTestHoomin(seed.hoominId);
  }
});
