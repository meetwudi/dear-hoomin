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

test("full first musing flow", async ({ context, page }) => {
  await seedBaseAvatarStyle();
  const hoomin = await createTestHoomin("E2E Hoomin");
  const petPhotoPath = await writePetPhotoFixture();

  try {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "see today's tiny musing." })).toBeVisible();
    await pauseForVideo(page);

    await signInAsHoomin(context, {
      hoominId: hoomin.id,
      email: hoomin.email,
      name: hoomin.name,
      picture: null,
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "ready for tiny musings?" })).toBeVisible();
    await pauseForVideo(page);

    await page.getByLabel("Family name").fill("E2E household");
    await page.getByRole("button", { name: "Create family" }).click();
    await expect(page).toHaveURL(/\/families\/[0-9a-f-]+$/);
    await expect(page.getByRole("heading", { name: "Add furbaby" })).toBeVisible();
    await pauseForVideo(page);

    await page.getByLabel("Furbaby name").fill("Mochi");
    await page.getByLabel("Reference photo").setInputFiles(petPhotoPath);
    await page.getByRole("button", { name: "Add furbaby" }).click();

    await expect(page).toHaveURL(/\/families\/[0-9a-f-]+$/);
    await expect(page.getByRole("combobox", { name: "Furbaby" })).toHaveValue(/.+/);
    await page.getByRole("button", { name: "Change" }).click();
    await expect(page.getByRole("heading", { name: "Which one looks most like Mochi?" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Pick me/ }).first()).toBeVisible();
    await pauseForVideo(page);

    await page.getByRole("button", { name: /Pick me/ }).first().click();
    await page.getByRole("link", { name: "Musings" }).click();
    await expect(page.getByRole("button", { name: "Make today's musing" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Musings" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Family" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Furbaby" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Journal" })).toHaveCount(0);
    await expect(page.getByLabel("Journal note")).toBeVisible();
    await expect(page.getByRole("button", { name: "Make a journal musing" })).toBeVisible();
    await page.getByRole("link", { name: "Family" }).click();
    await expect(page.getByRole("combobox", { name: "Furbaby" })).toHaveValue(/.+/);
    await expect(page.getByRole("link", { name: "Add furbaby" })).toBeVisible();
    await expect(page.getByLabel("Furbaby name")).toHaveValue("Mochi");
    await expect(page.getByLabel("Tell us a bit more about Mochi")).toBeVisible();
    await page.getByRole("button", { name: "Change" }).click();
    await expect(page.getByRole("heading", { name: "Which one looks most like Mochi?" })).toBeVisible();
    await page.getByRole("button", { name: "Dismiss" }).click();
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
    await expect(page.getByRole("button", { name: /browser nudges/ })).toBeVisible();
    await page.getByRole("link", { name: "Musings" }).click();
    await expect(page.getByRole("button", { name: "Make today's musing" })).toBeVisible();
    await pauseForVideo(page);

    await page.getByRole("button", { name: "Make today's musing" }).click();
    await expect(page.getByText("Mochi has completed a careful investigation of the snack zone.")).toBeVisible();
    await expect(page.getByRole("img", { name: "Mochi's generated musing" })).toBeVisible();
    await pauseForVideo(page);

    await page.getByLabel("Journal note").fill("Mochi has strong window opinions.");
    await page.locator('input[name="photos"]').setInputFiles(petPhotoPath);
    await expect(page.getByLabel("Selected photos")).toBeVisible();
    await expect(page.getByRole("img", { name: "Selected photo 1" })).toBeVisible();

    await page.getByRole("button", { name: "Make a journal musing" }).click();
    await expect(
      page.getByText("Mochi reviewed the evidence and has one tiny conclusion."),
    ).toBeVisible();
    await expect(page.getByRole("img", { name: "Mochi journal photo 1" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Mochi's generated musing" })).toHaveCount(2);
    await expect(page.getByLabel("Journal note")).toHaveValue("");
    await pauseForVideo(page);
  } finally {
    await cleanupTestHoomin(hoomin.id);
  }
});
