import type { FastifyPluginAsync } from "fastify";
import {
  API_ROUTES,
  type ApiError,
  type CreateTaskInput,
  type Task,
  type UpdateTaskInput,
} from "@repo/shared";
import type { Database } from "../db/client.js";
import { createTaskRepository } from "../db/task-repository.js";

const uuidPattern =
  "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";

const errorSchema = {
  type: "object",
  additionalProperties: false,
  required: ["statusCode", "error", "message"],
  properties: {
    statusCode: { type: "number" },
    error: { type: "string" },
    message: { type: "string" },
  },
};

const taskSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "title",
    "description",
    "completed",
    "createdAt",
    "updatedAt",
  ],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    description: {
      anyOf: [{ type: "string" }, { type: "null" }],
    },
    completed: { type: "boolean" },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
};

const idParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id"],
  properties: {
    id: { type: "string", pattern: uuidPattern },
  },
};

const createTaskBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["title"],
  properties: {
    title: { type: "string", minLength: 1, maxLength: 200 },
    description: {
      anyOf: [{ type: "string", maxLength: 2000 }, { type: "null" }],
    },
    completed: { type: "boolean" },
  },
};

const updateTaskBodySchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    title: { type: "string", minLength: 1, maxLength: 200 },
    description: {
      anyOf: [{ type: "string", maxLength: 2000 }, { type: "null" }],
    },
    completed: { type: "boolean" },
  },
};

function taskNotFound(id: string): ApiError {
  return {
    statusCode: 404,
    error: "Not Found",
    message: `Task ${id} not found.`,
  };
}

function badRequest(message: string): ApiError {
  return { statusCode: 400, error: "Bad Request", message };
}

export const taskRoutes: FastifyPluginAsync<{ db: Database }> = async (
  app,
  { db },
) => {
  const repository = createTaskRepository(db);

  app.get(
    API_ROUTES.tasks,
    {
      schema: {
        response: {
          200: { type: "array", items: taskSchema },
        },
      },
    },
    async (): Promise<Task[]> => repository.list(),
  );

  app.get<{ Params: { id: string } }>(
    `${API_ROUTES.tasks}/:id`,
    {
      schema: {
        params: idParamsSchema,
        response: {
          200: taskSchema,
          404: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const task = await repository.findById(request.params.id);

      if (!task) {
        return reply.code(404).send(taskNotFound(request.params.id));
      }

      return task;
    },
  );

  app.post<{ Body: CreateTaskInput }>(
    API_ROUTES.tasks,
    {
      schema: {
        body: createTaskBodySchema,
        response: {
          201: taskSchema,
          400: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const title = request.body.title.trim();

      if (!title) {
        return reply.code(400).send(badRequest("title must not be blank."));
      }

      const task = await repository.create({ ...request.body, title });

      return reply.code(201).send(task);
    },
  );

  app.patch<{ Params: { id: string }; Body: UpdateTaskInput }>(
    `${API_ROUTES.tasks}/:id`,
    {
      schema: {
        params: idParamsSchema,
        body: updateTaskBodySchema,
        response: {
          200: taskSchema,
          400: errorSchema,
          404: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const patch = { ...request.body };

      if (patch.title !== undefined) {
        patch.title = patch.title.trim();

        if (!patch.title) {
          return reply.code(400).send(badRequest("title must not be blank."));
        }
      }

      const task = await repository.update(request.params.id, patch);

      if (!task) {
        return reply.code(404).send(taskNotFound(request.params.id));
      }

      return task;
    },
  );

  app.delete<{ Params: { id: string } }>(
    `${API_ROUTES.tasks}/:id`,
    {
      schema: {
        params: idParamsSchema,
        response: {
          404: errorSchema,
        },
      },
    },
    async (request, reply) => {
      const deleted = await repository.delete(request.params.id);

      if (!deleted) {
        return reply.code(404).send(taskNotFound(request.params.id));
      }

      return reply.code(204).send();
    },
  );
};
