import type { FastifyPluginAsync } from "fastify";
import { API_ROUTES, type HealthResponse } from "@repo/shared";
import { SERVICE_NAME, SERVICE_VERSION } from "../config/service.js";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    API_ROUTES.health,
    {
      schema: {
        response: {
          200: {
            type: "object",
            additionalProperties: false,
            required: ["status", "service", "version", "timestamp", "uptime"],
            properties: {
              status: { type: "string", enum: ["ok", "degraded"] },
              service: { type: "string" },
              version: { type: "string" },
              timestamp: { type: "string" },
              uptime: { type: "number" },
            },
          },
        },
      },
    },
    async (): Promise<HealthResponse> => ({
      status: "ok",
      service: SERVICE_NAME,
      version: SERVICE_VERSION,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
    }),
  );
};
