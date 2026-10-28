import type { FastifyInstance } from "fastify";
import type { HealthResponse } from "@repo/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";

describe("GET /api/health", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("reports the service as healthy", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/health",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<HealthResponse>();

    expect(body.status).toBe("ok");
    expect(body.service).toBe("api");
    expect(body.version).toBe("0.1.0");
    expect(typeof body.uptime).toBe("number");
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });
});
