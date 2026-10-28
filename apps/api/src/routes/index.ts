import type { FastifyPluginAsync } from "fastify";
import type { Database } from "../db/client.js";
import { healthRoutes } from "./health.js";
import { taskRoutes } from "./tasks.js";

export const apiRoutes: FastifyPluginAsync<{ db: Database }> = async (
  app,
  { db },
) => {
  await app.register(healthRoutes);
  await app.register(taskRoutes, { db });
};
