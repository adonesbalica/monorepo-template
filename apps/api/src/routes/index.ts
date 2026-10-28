import type { FastifyPluginAsync } from "fastify";
import { healthRoutes } from "./health.js";

export const apiRoutes: FastifyPluginAsync = async (app) => {
  await app.register(healthRoutes);
};
