import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { ApiError, Task } from "@repo/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { createTestDatabase, type TestDatabase } from "../test/database.js";

describe("tasks API", () => {
  let app: FastifyInstance;
  let database: TestDatabase;

  beforeAll(async () => {
    database = await createTestDatabase();
    app = await buildApp({ db: database.db });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await database.close();
  });

  async function createTask(payload: Record<string, unknown> = {}) {
    const response = await app.inject({
      method: "POST",
      url: "/api/tasks",
      payload: { title: "Write the docs", ...payload },
    });

    expect(response.statusCode).toBe(201);

    return response.json<Task>();
  }

  it("creates a task with defaults", async () => {
    const task = await createTask({ description: "Document the API" });

    expect(task.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(task.title).toBe("Write the docs");
    expect(task.description).toBe("Document the API");
    expect(task.completed).toBe(false);
    expect(Number.isNaN(Date.parse(task.createdAt))).toBe(false);
    expect(Number.isNaN(Date.parse(task.updatedAt))).toBe(false);
  });

  it("lists every task", async () => {
    const first = await createTask({ title: "First task" });
    const second = await createTask({ title: "Second task" });

    const response = await app.inject({ method: "GET", url: "/api/tasks" });
    const tasks = response.json<Task[]>();

    expect(response.statusCode).toBe(200);
    expect(tasks.map((task) => task.id)).toEqual(
      expect.arrayContaining([first.id, second.id]),
    );
  });

  it("reads a task by id", async () => {
    const created = await createTask({ title: "Read me" });

    const response = await app.inject({
      method: "GET",
      url: `/api/tasks/${created.id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<Task>()).toEqual(created);
  });

  it("updates only the provided fields", async () => {
    const created = await createTask({
      title: "Update me",
      description: "Keep this description",
    });

    const response = await app.inject({
      method: "PATCH",
      url: `/api/tasks/${created.id}`,
      payload: { completed: true },
    });
    const updated = response.json<Task>();

    expect(response.statusCode).toBe(200);
    expect(updated.title).toBe("Update me");
    expect(updated.description).toBe("Keep this description");
    expect(updated.completed).toBe(true);
    expect(Date.parse(updated.updatedAt)).toBeGreaterThanOrEqual(
      Date.parse(created.updatedAt),
    );
  });

  it("deletes a task", async () => {
    const created = await createTask({ title: "Delete me" });

    const deleted = await app.inject({
      method: "DELETE",
      url: `/api/tasks/${created.id}`,
    });

    expect(deleted.statusCode).toBe(204);
    expect(deleted.body).toBe("");

    const missing = await app.inject({
      method: "GET",
      url: `/api/tasks/${created.id}`,
    });

    expect(missing.statusCode).toBe(404);
  });

  it("returns 404 for an unknown task", async () => {
    const id = randomUUID();

    const responses = await Promise.all([
      app.inject({ method: "GET", url: `/api/tasks/${id}` }),
      app.inject({
        method: "PATCH",
        url: `/api/tasks/${id}`,
        payload: { completed: true },
      }),
      app.inject({ method: "DELETE", url: `/api/tasks/${id}` }),
    ]);

    for (const response of responses) {
      expect(response.statusCode).toBe(404);
      expect(response.json<ApiError>().message).toContain(id);
    }
  });

  it("rejects invalid payloads and ids", async () => {
    const missingTitle = await app.inject({
      method: "POST",
      url: "/api/tasks",
      payload: { description: "No title" },
    });
    const blankTitle = await app.inject({
      method: "POST",
      url: "/api/tasks",
      payload: { title: "   " },
    });
    const emptyPatch = await app.inject({
      method: "PATCH",
      url: `/api/tasks/${randomUUID()}`,
      payload: {},
    });
    const invalidId = await app.inject({
      method: "GET",
      url: "/api/tasks/not-a-uuid",
    });

    expect(missingTitle.statusCode).toBe(400);
    expect(blankTitle.statusCode).toBe(400);
    expect(emptyPatch.statusCode).toBe(400);
    expect(invalidId.statusCode).toBe(400);
  });
});
