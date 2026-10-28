import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { fileURLToPath } from "node:url";
import * as schema from "../db/schema.js";

export interface TestDatabase {
  db: PgliteDatabase<typeof schema>;
  close: () => Promise<void>;
}

const migrationsFolder = fileURLToPath(
  new URL("../../drizzle", import.meta.url),
);

/**
 * Starts an in-memory Postgres (PGlite) and applies the real migrations, so
 * tests exercise the same schema as development without any infrastructure.
 */
export async function createTestDatabase(): Promise<TestDatabase> {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  await migrate(db, { migrationsFolder });

  return {
    db,
    close: async () => {
      await client.close();
    },
  };
}
