import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const screenshotMode =
  process.env.E2E_SCREENSHOTS === "on"
    ? "on"
    : process.env.E2E_SCREENSHOTS === "only-on-failure"
      ? "only-on-failure"
      : "off";
const videoMode =
  process.env.E2E_VIDEO === "on"
    ? "on"
    : process.env.E2E_VIDEO === "retain-on-failure"
      ? "retain-on-failure"
      : "off";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    screenshot: screenshotMode,
    trace: "on-first-retry",
    video: videoMode,
  },
  webServer: {
    command: `npm run build && npm run start -- -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
