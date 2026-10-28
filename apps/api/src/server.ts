import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = await buildApp();

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
