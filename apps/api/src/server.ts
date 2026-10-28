import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { createDatabase } from "./db/client.js";
import { runMigrations } from "./db/migrate.js";

const connection = createDatabase(env.DATABASE_URL);

try {
  await runMigrations(connection.db);
} catch (error) {
  console.error(
    "Failed to run database migrations. Is Postgres running? Start it with `pnpm db:up`.",
  );
  console.error(error);
  await connection.close();
  process.exit(1);
}

const app = await buildApp({
  db: connection.db,
  closeDatabase: connection.close,
});

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  app.log.info({ signal }, "received shutdown signal");

  try {
    await app.close();
    process.exit(0);
  } catch (error) {
    app.log.error(error, "failed to shut down cleanly");
    process.exit(1);
  }
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void shutdown(signal);
  });
}

try {
  await app.listen({ host: env.HOST, port: env.PORT });
} catch (error) {
  app.log.error(error, "failed to start server");
  process.exit(1);
}
