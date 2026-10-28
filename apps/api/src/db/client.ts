import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as schema from "./schema.js";

/**
 * Driver-agnostic database type. The API runs on node-postgres, while the
 * tests use PGlite (Postgres in WebAssembly) through the same interface.
 */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export type NodeDatabase = NodePgDatabase<typeof schema>;

export interface DatabaseConnection {
  db: NodeDatabase;
  close: () => Promise<void>;
}

export function createDatabase(connectionString: string): DatabaseConnection {
  const pool = new Pool({ connectionString });

  return {
    db: drizzle(pool, { schema }),
    close: async () => {
      await pool.end();
    },
  };
}
