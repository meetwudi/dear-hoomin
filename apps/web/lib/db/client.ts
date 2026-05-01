import { Pool } from "pg";

type GlobalWithPgPool = typeof globalThis & {
  dearHoominPgPool?: Pool;
};

function getDatabaseUrl() {
  const databaseUrl = process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL;

  if (!databaseUrl) {
    throw new Error("Missing POSTGRES_URL or POSTGRES_PRISMA_URL");
  }

  const normalizedUrl = new URL(databaseUrl);
  normalizedUrl.searchParams.delete("sslmode");

  return normalizedUrl.toString();
}

export function getPool() {
  const globalWithPgPool = globalThis as GlobalWithPgPool;

  if (!globalWithPgPool.dearHoominPgPool) {
    globalWithPgPool.dearHoominPgPool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 5,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  return globalWithPgPool.dearHoominPgPool;
}
