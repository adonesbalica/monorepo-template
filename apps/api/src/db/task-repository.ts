import type { CreateTaskInput, Task, UpdateTaskInput } from "@repo/shared";
import { desc, eq } from "drizzle-orm";
import type { Database } from "./client.js";
import { tasks, type NewTaskRow, type TaskRow } from "./schema.js";

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    completed: row.completed,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function createTaskRepository(db: Database) {
  return {
    async list(): Promise<Task[]> {
      const rows = await db.select().from(tasks).orderBy(desc(tasks.createdAt));

      return rows.map(toTask);
    },

    async findById(id: string): Promise<Task | null> {
      const [row] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, id))
        .limit(1);

      return row ? toTask(row) : null;
    },

    async create(input: CreateTaskInput): Promise<Task> {
      const [row] = await db
        .insert(tasks)
        .values({
          title: input.title,
          description: input.description ?? null,
          completed: input.completed ?? false,
        })
        .returning();

      if (!row) {
        throw new Error("Failed to create task.");
      }

      return toTask(row);
    },

    async update(id: string, input: UpdateTaskInput): Promise<Task | null> {
      const values: Partial<NewTaskRow> = { updatedAt: new Date() };

      if (input.title !== undefined) {
        values.title = input.title;
      }

      if (input.description !== undefined) {
        values.description = input.description;
      }

      if (input.completed !== undefined) {
        values.completed = input.completed;
      }

      const [row] = await db
        .update(tasks)
        .set(values)
        .where(eq(tasks.id, id))
        .returning();

      return row ? toTask(row) : null;
    },

    async delete(id: string): Promise<boolean> {
      const rows = await db
        .delete(tasks)
        .where(eq(tasks.id, id))
        .returning({ id: tasks.id });

      return rows.length > 0;
    },
  };
}

export type TaskRepository = ReturnType<typeof createTaskRepository>;
