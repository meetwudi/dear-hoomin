import { Pool } from "pg";

type GlobalWithPgPool = typeof globalThis & {
  dearHoominPgPool?: Pool;
};

function getDatabaseConfig() {
  const databaseUrl = process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL;

  if (!databaseUrl) {
    throw new Error("Missing POSTGRES_URL or POSTGRES_PRISMA_URL");
  }

  const normalizedUrl = new URL(databaseUrl);
  const sslMode = normalizedUrl.searchParams.get("sslmode");
  normalizedUrl.searchParams.delete("sslmode");
  const isLocalDatabase = ["localhost", "127.0.0.1", "::1"].includes(
    normalizedUrl.hostname,
  );
  const useSsl = sslMode === "require" || (!isLocalDatabase && sslMode !== "disable");

  return {
    connectionString: normalizedUrl.toString(),
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  };
}

export function getPool() {
  const globalWithPgPool = globalThis as GlobalWithPgPool;

  if (!globalWithPgPool.dearHoominPgPool) {
    globalWithPgPool.dearHoominPgPool = new Pool({
      ...getDatabaseConfig(),
      max: 5,
    });
  }

  return globalWithPgPool.dearHoominPgPool;
}
