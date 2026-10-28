import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { NodeDatabase } from "./client.js";

/**
 * Works from both `src/db` (tsx) and `dist/db` (compiled), because migrations
 * live at the root of the API package.
 */
export const migrationsFolder = fileURLToPath(
  new URL("../../drizzle", import.meta.url),
);

export async function runMigrations(db: NodeDatabase): Promise<void> {
  await migrate(db, { migrationsFolder });
}
