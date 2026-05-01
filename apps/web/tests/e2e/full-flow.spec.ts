import { expect, test } from "@playwright/test";
import { signInAsHoomin } from "./support/auth";
import {
  cleanupTestHoomin,
  closeDb,
  createTestHoomin,
  seedBaseAvatarStyle,
  writePetPhotoFixture,
} from "./support/db";

async function pauseForVideo(page: { waitForTimeout(timeout: number): Promise<void> }) {
  await page.waitForTimeout(900);
}

test.afterAll(async () => {
  await closeDb();
});

test("full first thought flow", async ({ context, page }) => {
  await seedBaseAvatarStyle();
  const hoomin = await createTestHoomin("E2E Hoomin");
  const petPhotoPath = await writePetPhotoFixture();

  try {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "see today's tiny thought." })).toBeVisible();
    await pauseForVideo(page);

    await signInAsHoomin(context, {
      hoominId: hoomin.id,
      email: hoomin.email,
      name: hoomin.name,
      picture: null,
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "ready for tiny thoughts?" })).toBeVisible();
    await pauseForVideo(page);

    await page.getByLabel("Family name").fill("E2E household");
    await page.getByRole("button", { name: "Create family" }).click();
    await expect(page).toHaveURL(/\/families\/[0-9a-f-]+$/);
    await expect(page.getByRole("heading", { name: "Add pet" })).toBeVisible();
    await pauseForVideo(page);

    await page.getByLabel("Pet name").fill("Mochi");
    await page.getByLabel("Species").fill("cat");
    await page.getByLabel("Reference photo").setInputFiles(petPhotoPath);
    await page.getByRole("button", { name: "Add pet" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { exact: true, name: "Mochi" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Which one looks most like Mochi?" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Pick me/ }).first()).toBeVisible();
    await pauseForVideo(page);

    await page.getByRole("button", { name: /Pick me/ }).first().click();
    await expect(page.getByRole("button", { name: "Make today's musing" })).toBeVisible();
    await pauseForVideo(page);

    await page.getByRole("button", { name: "Make today's musing" }).click();
    await expect(page.getByText("Mochi has completed a careful investigation of the snack zone.")).toBeVisible();
    await expect(page.getByRole("img", { name: "Mochi's generated thought" })).toBeVisible();
    await pauseForVideo(page);
  } finally {
    await cleanupTestHoomin(hoomin.id);
  }
});
