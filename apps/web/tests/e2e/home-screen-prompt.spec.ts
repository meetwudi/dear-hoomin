import { devices, expect, test } from "@playwright/test";
import { signInAsHoomin } from "./support/auth";
import { cleanupTestHoomin, closeDb, createTestHoomin } from "./support/db";

const dismissedStorageKey = "dear-hoomin:add-to-home-screen-dismissed";

test.afterAll(async () => {
  await closeDb();
});

test("iOS home screen prompt is modal-only and dismisses permanently", async ({ browser }) => {
  const hoomin = await createTestHoomin("iOS Hoomin");
  const context = await browser.newContext({
    ...devices["iPhone 14"],
  });
  const page = await context.newPage();

  try {
    await signInAsHoomin(context, {
      hoominId: hoomin.id,
      email: hoomin.email,
      name: hoomin.name,
      picture: null,
    });

    await page.goto("/");
    await expect(page.getByRole("button", { name: "Install" })).toHaveCount(0);

    const prompt = page.getByRole("dialog", {
      name: "Add Dear Hoomin to Home Screen",
    });
    await expect(prompt).toBeVisible();
    await expect(prompt.getByText("Tap Share")).toBeVisible();

    await prompt.getByRole("button", { name: "Got it" }).click();
    await expect(prompt).toHaveCount(0);
    await expect(
      page.evaluate((key) => window.localStorage.getItem(key), dismissedStorageKey),
    ).resolves.toBe("true");

    await page.getByLabel("Family name").fill("iOS household");
    await page.getByRole("button", { name: "Create family" }).click();
    await expect(page).toHaveURL(/\/families\/[0-9a-f-]+$/);
    await expect(page.getByRole("link", { name: "Family" })).toBeVisible();

    await page.evaluate((key) => window.localStorage.removeItem(key), dismissedStorageKey);
    await page.reload();
    await expect(prompt).toBeVisible();

    const backdrop = page.locator(".app-modal-backdrop");
    await expect(backdrop).toHaveCSS("position", "fixed");
    await expect.poll(async () =>
        Number(await backdrop.evaluate((node) => getComputedStyle(node).zIndex)),
    ).toBeGreaterThan(1000000);

    await expect.poll(async () =>
        page.locator(".app-modal-panel").evaluate((node) => {
          const rect = node.getBoundingClientRect();
          const element = document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
          );

          return Boolean(element?.closest(".app-modal-panel"));
        }),
    ).toBe(true);
  } finally {
    await context.close();
    await cleanupTestHoomin(hoomin.id);
  }
});
