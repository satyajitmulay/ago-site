import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

type Db = ReturnType<typeof drizzle>;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPostgresqlDb?: Db;
};

function createDb(): Db {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your environment (e.g. Vercel → Settings → Environment Variables) or remove the DB dependency.",
    );
  }
  const pool =
    globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({ connectionString: databaseUrl });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }
  return drizzle(pool);
}

/** Lazily created — importing this module never throws, only using it requires DATABASE_URL. */
export function getDb(): Db {
  globalForDb.__arenaNextJsPostgresqlDb ??= createDb();
  return globalForDb.__arenaNextJsPostgresqlDb;
}

/** Drop-in compatible with the old `db` export, but connects on first query instead of at import time. */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const real = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
