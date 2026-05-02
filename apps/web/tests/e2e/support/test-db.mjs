import { randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function docker(args, options = {}) {
  return execFileAsync("docker", args, {
    maxBuffer: 1024 * 1024,
    ...options,
  });
}

async function waitForPostgres(containerName) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < 30_000) {
    try {
      await docker(["exec", containerName, "pg_isready", "-U", "postgres"]);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw lastError ?? new Error("postgres_not_ready");
}

async function runPsqlWhenReady(containerName, args) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < 30_000) {
    try {
      return await docker(["exec", containerName, "psql", ...args]);
    } catch (error) {
      lastError = error;
      await waitForPostgres(containerName).catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw lastError ?? new Error("postgres_psql_not_ready");
}

async function getPublishedPort(containerName) {
  const { stdout } = await docker(["port", containerName, "5432/tcp"]);
  const endpoint = stdout.trim().split("\n")[0];
  const port = endpoint?.split(":").at(-1);

  if (!port) {
    throw new Error("postgres_port_not_published");
  }

  return port;
}

export async function startTestDatabase({ migrationPath }) {
  const containerName = `dear-hoomin-e2e-${process.pid}-${randomBytes(4).toString("hex")}`;
  const localMigrationPath = fileURLToPath(migrationPath);

  await docker([
    "run",
    "--name",
    containerName,
    "-e",
    "POSTGRES_PASSWORD=postgres",
    "-p",
    "127.0.0.1::5432",
    "-d",
    "postgres:16",
  ]);

  try {
    await waitForPostgres(containerName);
    const hostPort = await getPublishedPort(containerName);
    const databaseUrl = `postgres://postgres:postgres@127.0.0.1:${hostPort}/postgres`;
    await docker(["cp", localMigrationPath, `${containerName}:/tmp/initial_schema.sql`]);
    await runPsqlWhenReady(containerName, [
      "-U",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-f",
      "/tmp/initial_schema.sql",
    ]);

    return {
      containerName,
      databaseUrl,
      async stop() {
        await docker(["rm", "-f", containerName]).catch(() => undefined);
      },
    };
  } catch (error) {
    await docker(["rm", "-f", containerName]).catch(() => undefined);
    throw error;
  }
}
