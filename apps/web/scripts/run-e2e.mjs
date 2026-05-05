import { spawn } from "node:child_process";
import { readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { startTestDatabase } from "../tests/e2e/support/test-db.mjs";

const authSecret = "e2e-auth-session-secret-at-least-32-chars";
const baselineMigrationFile = "202605010001_initial_schema.sql";
const migrationsFoldedIntoBaselineThrough = "202605010010_push_subscription_client_ids.sql";
const port = process.env.E2E_PORT ?? "3100";
const localStorageDir = resolve("test-results/e2e-local-storage");
let database;

function parseArgs(args) {
  const playwrightArgs = [];
  let screenshots = process.env.E2E_SCREENSHOTS;
  let video = process.env.E2E_VIDEO;

  for (const arg of args) {
    if (arg === "--screenshots") {
      screenshots = "on";
    } else if (arg === "--screenshots-on-failure") {
      screenshots = "only-on-failure";
    } else if (arg === "--video") {
      video = "on";
    } else if (arg === "--video-on-failure") {
      video = "retain-on-failure";
    } else {
      playwrightArgs.push(arg);
    }
  }

  return {
    playwrightArgs,
    screenshots,
    video,
  };
}

function runPlaywright(args, env) {
  return new Promise((resolve) => {
    const child = spawn("npx", ["playwright", "test", ...args], {
      cwd: process.cwd(),
      env,
      stdio: "inherit",
    });

    child.on("exit", (code, signal) => {
      resolve(signal ? 1 : code ?? 1);
    });
  });
}

try {
  const { playwrightArgs, screenshots, video } = parseArgs(process.argv.slice(2));
  await rm(localStorageDir, { recursive: true, force: true });
  const migrationsUrl = new URL("../../../infra/supabase/migrations/", import.meta.url);
  const migrationFiles = (await readdir(migrationsUrl))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  const e2eMigrationFiles = [
    baselineMigrationFile,
    ...migrationFiles.filter(
      (file) => file > migrationsFoldedIntoBaselineThrough,
    ),
  ];
  database = await startTestDatabase({
    migrationPaths: e2eMigrationFiles.map((file) => new URL(file, migrationsUrl)),
  });

  const exitCode = await runPlaywright(playwrightArgs, {
    ...process.env,
    APP_AI_ADAPTER: "mock",
    APP_LOCAL_STORAGE_DIR: localStorageDir,
    APP_STORAGE_ADAPTER: "local",
    AUTH_SESSION_SECRET: process.env.AUTH_SESSION_SECRET ?? authSecret,
    CRON_SECRET: process.env.CRON_SECRET ?? "e2e-cron-secret-at-least-16-chars",
    E2E_SCREENSHOTS: screenshots ?? "off",
    E2E_VIDEO: video ?? "off",
    E2E_DATABASE_CONTAINER: database.containerName,
    E2E_PORT: port,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY:
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ??
      "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
    NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${port}`,
    PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${port}`,
    POSTGRES_PRISMA_URL: database.databaseUrl,
    POSTGRES_URL: database.databaseUrl,
  });

  process.exitCode = exitCode;
} finally {
  if (database) {
    await database.stop();
  }
}
