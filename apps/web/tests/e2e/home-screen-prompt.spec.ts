import { devices, expect, test } from "@playwright/test";
import { signInAsHoomin } from "./support/auth";
import { cleanupTestHoomin, closeDb, createTestHoomin } from "./support/db";

test.afterAll(async () => {
  await closeDb();
});

test("home screen prompt can be previewed with a local URL override", async ({
  context,
  page,
}) => {
  const hoomin = await createTestHoomin("Preview Hoomin");

  try {
    await signInAsHoomin(context, {
      hoominId: hoomin.id,
      email: hoomin.email,
      name: hoomin.name,
      picture: null,
    });

    await page.goto("/?showHomeScreenPrompt=1");

    const prompt = page.getByRole("dialog", {
      name: "Install Dear Hoomin from Safari",
    });
    await expect(prompt).toBeVisible();
    await expect(
      prompt.getByText("Dear Hoomin only works when it is installed"),
    ).toBeVisible();
    await expect(prompt.getByText("Tap More")).toBeVisible();
    await expect(prompt.getByText("Open View More")).toBeVisible();
    await expect(prompt.getByText("Add to Home Screen", { exact: true })).toBeVisible();
    await expect(prompt.getByText("Keep Open as Web App on")).toBeVisible();
    await expect(prompt.getByRole("button", { name: "Continue" })).toHaveCount(0);
    await expect(prompt.getByRole("button", { name: "Dismiss" })).toBeVisible();
    await expect(prompt.getByRole("button", { name: "Got it" })).toBeVisible();
    await expect
      .poll(async () => page.evaluate(() => document.body.style.position))
      .toBe("fixed");

    await prompt.getByRole("button", { name: "Got it" }).click();
    await expect(prompt).toHaveCount(0);
    await expect
      .poll(async () => page.evaluate(() => document.body.style.position))
      .toBe("");

    await page.reload();
    await expect(prompt).toBeVisible();
  } finally {
    await cleanupTestHoomin(hoomin.id);
  }
});

test("iOS Safari home screen prompt is modal-only and returns after reload", async ({
  browser,
}) => {
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
      name: "Install Dear Hoomin from Safari",
    });
    await expect(prompt).toBeVisible();
    await expect(prompt.getByText("Tap More")).toBeVisible();
    await expect(prompt.getByText("Open View More")).toBeVisible();
    await expect(prompt.getByText("Add to Home Screen", { exact: true })).toBeVisible();
    await expect(prompt.getByRole("button", { name: "Continue" })).toHaveCount(0);
    await expect(prompt.getByRole("button", { name: "Dismiss" })).toBeVisible();
    await expect(prompt.getByRole("button", { name: "Got it" })).toBeVisible();
    await expect
      .poll(async () => page.evaluate(() => document.body.style.overflow))
      .toBe("hidden");

    await prompt.getByRole("button", { name: "Got it" }).click();
    await expect(prompt).toHaveCount(0);
    await expect
      .poll(async () => page.evaluate(() => document.body.style.overflow))
      .toBe("");

    await page.getByLabel("Family name").fill("iOS household");
    await page.getByRole("button", { name: "Create family" }).click();
    await expect(page).toHaveURL(/\/families\/[0-9a-f-]+$/);
    await expect(page.getByRole("link", { name: "Family" })).toBeVisible();

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
