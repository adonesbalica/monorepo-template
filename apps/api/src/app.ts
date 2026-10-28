import cors from "@fastify/cors";
import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import { API_ROUTES, type ApiError } from "@repo/shared";
import { env } from "./config/env.js";
import { API_PREFIX, SERVICE_NAME, SERVICE_VERSION } from "./config/service.js";
import { createDatabase, type Database } from "./db/client.js";
import { apiRoutes } from "./routes/index.js";

export interface BuildAppOptions {
  db?: Database;
  closeDatabase?: () => Promise<void>;
}

function resolveCorsOrigin(): boolean | string[] {
  const origins = env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.includes("*") ? true : origins;
}

function createLoggerOptions() {
  if (env.NODE_ENV === "test") {
    return false;
  }

  if (env.NODE_ENV === "development") {
    return {
      level: env.LOG_LEVEL,
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      },
    };
  }

  return { level: env.LOG_LEVEL };
}

function resolveDatabase(options: BuildAppOptions): {
  db: Database;
  close?: () => Promise<void>;
} {
  if (options.db) {
    return { db: options.db, close: options.closeDatabase };
  }

  const connection = createDatabase(env.DATABASE_URL);

  return {
    db: connection.db,
    close: options.closeDatabase ?? connection.close,
  };
}

export async function buildApp(
  options: BuildAppOptions = {},
): Promise<FastifyInstance> {
  const { db, close } = resolveDatabase(options);

  const app = Fastify({
    logger: createLoggerOptions(),
  });

  if (close) {
    app.addHook("onClose", async () => {
      await close();
    });
  }

  await app.register(cors, {
    origin: resolveCorsOrigin(),
    credentials: true,
  });

  await app.register(apiRoutes, { prefix: API_PREFIX, db });

  app.get("/", async () => ({
    name: SERVICE_NAME,
    version: SERVICE_VERSION,
    health: `${API_PREFIX}${API_ROUTES.health}`,
    tasks: `${API_PREFIX}${API_ROUTES.tasks}`,
  }));

  app.setNotFoundHandler((request, reply) => {
    const error: ApiError = {
      statusCode: 404,
      error: "Not Found",
      message: `Route ${request.method} ${request.url} not found.`,
    };

    return reply.code(404).send(error);
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error(error);

    const statusCode = error.statusCode ?? 500;
    const payload: ApiError = {
      statusCode,
      error: statusCode >= 500 ? "Internal Server Error" : error.name,
      message:
        statusCode >= 500 ? "An unexpected error occurred." : error.message,
    };

    return reply.code(statusCode).send(payload);
  });

  return app;
}
