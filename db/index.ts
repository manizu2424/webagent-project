import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const DEFAULT_DATABASE_URL =
  "postgresql://webagent_user:change_this_password@localhost:5432/webagent";

declare global {
  var webagentPool: Pool | undefined;
}

function getDatabaseUrl() {
  return process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
}

function getPool() {
  if (!globalThis.webagentPool) {
    globalThis.webagentPool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 10,
    });
  }

  return globalThis.webagentPool;
}

export function getDb() {
  return drizzle(getPool(), { schema });
}

export async function checkDatabaseConnection() {
  const db = getDb();
  await db.execute(sql`select 1`);
}
