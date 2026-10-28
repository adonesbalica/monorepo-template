# Monorepo Template

A TypeScript monorepo starter with a React frontend, a Fastify API, and a
shared package for API contracts.

- **Frontend:** React 19, Vite 8, React Router 7, Vitest and Testing Library
- **Backend:** Fastify 5, Drizzle ORM, PostgreSQL, Zod-validated environment
- **Tooling:** pnpm workspaces, ESLint 10, Prettier 3 and GitHub Actions

## Requirements

- Node.js `>=22.12.0` (`.nvmrc` pins Node 24)
- pnpm `>=10` (`corepack enable` uses the version pinned in `packageManager`)
- Docker with Compose (for the local PostgreSQL container)

## Quick start

```bash
corepack enable
pnpm install
pnpm db:up
pnpm dev
```

`pnpm db:up` starts PostgreSQL in Docker and waits until it is healthy. The API
applies pending migrations on startup, so the `tasks` table is ready before the
first request.

| Service  | URL                              |
| -------- | -------------------------------- |
| Web      | http://localhost:5173            |
| API      | http://localhost:3000/api/health |
| Postgres | `localhost:5432`                 |

The Vite dev server proxies `/api` requests to `http://127.0.0.1:3000`.

## Workspace layout

```text
.
├─ apps/
│  ├─ api/
│  │  ├─ drizzle/       generated SQL migrations and snapshots
│  │  └─ src/
│  │     ├─ config/      environment schema and service constants
│  │     ├─ db/          Drizzle schema, connection and task repository
│  │     ├─ routes/      Fastify route plugins and tests
│  │     ├─ test/        in-memory PGlite database helper
│  │     ├─ app.ts       app factory used by tests and the server
│  │     └─ server.ts    entrypoint, migrations and graceful shutdown
│  └─ web/
│     └─ src/
│        ├─ components/  shared layout and navigation
│        ├─ pages/       route pages
│        ├─ lib/         fetch-based API client
│        ├─ App.tsx      route table
│        └─ main.tsx     BrowserRouter entrypoint
├─ packages/
│  └─ shared/            framework-agnostic API contracts
├─ docker-compose.yml    local PostgreSQL service
├─ .github/workflows/    CI pipeline
└─ package.json          workspace scripts
```

## Commands

| Command             | What it does                                         |
| ------------------- | ---------------------------------------------------- |
| `pnpm dev`          | Build shared, then run the API and web app in watch  |
| `pnpm dev:api`      | Run only the API                                     |
| `pnpm dev:web`      | Run only the web app                                 |
| `pnpm build`        | Build shared, then typecheck and build both apps     |
| `pnpm start`        | Start the production API build                       |
| `pnpm test`         | Run every Vitest suite                               |
| `pnpm test:watch`   | Run the app test suites in watch mode                |
| `pnpm typecheck`    | Typecheck every workspace package                    |
| `pnpm lint`         | Run ESLint                                           |
| `pnpm lint:fix`     | Run ESLint and apply safe fixes                      |
| `pnpm format`       | Format the repository with Prettier                  |
| `pnpm format:check` | Verify formatting without writing changes            |
| `pnpm db:up`        | Start PostgreSQL in Docker and wait until healthy    |
| `pnpm db:down`      | Stop the PostgreSQL container                        |
| `pnpm db:reset`     | Delete the database volume and start Postgres again  |
| `pnpm db:generate`  | Generate a SQL migration from the Drizzle schema     |
| `pnpm db:migrate`   | Apply pending migrations (the API does this on boot) |
| `pnpm db:studio`    | Open Drizzle Studio to browse the database           |

## Environment variables

Copy the examples before running the apps:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### API (`apps/api`)

| Variable       | Default                                                | Description                                      |
| -------------- | ------------------------------------------------------ | ------------------------------------------------ |
| `NODE_ENV`     | `development`                                          | `development`, `test` or `production`            |
| `HOST`         | `0.0.0.0`                                              | Interface the server binds to                    |
| `PORT`         | `3000`                                                 | HTTP port                                        |
| `LOG_LEVEL`    | `info`                                                 | Fastify/Pino log level                           |
| `CORS_ORIGIN`  | `http://localhost:5173`                                | Comma-separated origins; `*` reflects any origin |
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/monorepo` | PostgreSQL connection string                     |

### Web (`apps/web`)

| Variable            | Default                 | Description                                      |
| ------------------- | ----------------------- | ------------------------------------------------ |
| `VITE_API_BASE_URL` | `/api`                  | Public API base URL, including `/api`            |
| `API_PROXY_TARGET`  | `http://127.0.0.1:3000` | Target used by the Vite proxy during development |

## Routes

| Path     | Page           | Description                  |
| -------- | -------------- | ---------------------------- |
| `/`      | `HomePage`     | Health dashboard             |
| `/about` | `AboutPage`    | Workspace and stack overview |
| `*`      | `NotFoundPage` | Fallback for unknown routes  |

To add a page:

1. Create it in `apps/web/src/pages`, for example `ReportsPage.tsx`.
2. Add a route inside the layout route in `apps/web/src/App.tsx`:

   ```tsx
   <Route path="reports" element={<ReportsPage />} />
   ```

3. Add the entry to `navigation` in `apps/web/src/components/Layout.tsx` if it
   should appear in the header.

## API

```bash
curl http://localhost:3000/api/health
```

```json
{
  "status": "ok",
  "service": "api",
  "version": "0.1.0",
  "timestamp": "2026-01-01T12:00:00.000Z",
  "uptime": 42
}
```

`GET /` returns a small service descriptor. API routes live in
`apps/api/src/routes` and are registered under the `/api` prefix.

### Tasks

| Method   | Path             | Description                |
| -------- | ---------------- | -------------------------- |
| `GET`    | `/api/tasks`     | List tasks, newest first   |
| `POST`   | `/api/tasks`     | Create a task (`201`)      |
| `GET`    | `/api/tasks/:id` | Read a task                |
| `PATCH`  | `/api/tasks/:id` | Update the provided fields |
| `DELETE` | `/api/tasks/:id` | Delete a task (`204`)      |

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Integrate Drizzle", "description": "Ship the tasks CRUD"}'

curl http://localhost:3000/api/tasks
curl -X PATCH http://localhost:3000/api/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
curl -X DELETE http://localhost:3000/api/tasks/<id>
```

Requests and responses are validated with JSON Schema. The shared `Task`,
`CreateTaskInput` and `UpdateTaskInput` types keep the frontend aligned with the
API contract.

## Database

The API uses [Drizzle ORM](https://orm.drizzle.team) with PostgreSQL. For local
development, `docker-compose.yml` runs `postgres:17-alpine` with a named volume,
so data survives container restarts.

```bash
pnpm db:up       # start Postgres and wait for the health check
pnpm dev         # the API applies pending migrations before listening
```

The default connection string is
`postgres://postgres:postgres@localhost:5432/monorepo`. Override it with
`DATABASE_URL` in `apps/api/.env` when needed.

### Changing the schema

1. Edit `apps/api/src/db/schema.ts`.
2. Run `pnpm db:generate` and commit the files created in `apps/api/drizzle`.
3. Restart the API (or run `pnpm db:migrate`) to apply the migration.

Useful commands:

```bash
pnpm db:studio   # browse tables and rows in Drizzle Studio
pnpm db:reset    # drop the volume and recreate an empty database
pnpm db:down     # stop the container
```

Tests do not need Docker: `apps/api/src/test/database.ts` starts an in-memory
PGlite instance and applies the same SQL migrations. This keeps `pnpm test`
fast and infrastructure-free, including in CI.

## Shared contracts

Both apps import response types from `@repo/shared`:

```ts
import type { HealthResponse } from "@repo/shared";
```

Add new contracts in `packages/shared/src/index.ts`. The package is compiled to
`dist` before the apps start, so restart `pnpm dev` after changing it (or run
`pnpm --filter @repo/shared dev` in a second terminal while working on it).

## Production build

```bash
pnpm build
pnpm start
```

The API starts from `apps/api/dist/server.js` and applies pending migrations on
boot. Keep the `apps/api/drizzle` directory next to `dist` (or run
`pnpm db:migrate` during deploy) and provide a production `DATABASE_URL`. Deploy
`apps/web/dist` to any static host or CDN. When the API lives on another origin,
set `VITE_API_BASE_URL` at build time and add the web origin to `CORS_ORIGIN`.

## CI

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`:

1. Install with a frozen lockfile.
2. Lint and check formatting.
3. Typecheck, test and build every package.

API tests use PGlite, so CI does not start a PostgreSQL service or require
Docker.

## Commit convention

Commits follow [Conventional Commits](https://www.conventionalcommits.org):

```text
<type>(<scope>): <summary>
```

| Type       | Use for                                             |
| ---------- | --------------------------------------------------- |
| `feat`     | New user-facing behavior                            |
| `fix`      | Bug fixes                                           |
| `docs`     | Documentation only                                  |
| `style`    | Formatting or whitespace, no behavior change        |
| `refactor` | Code changes that neither add a feature nor fix one |
| `perf`     | Performance improvements                            |
| `test`     | Adding or updating tests                            |
| `build`    | Build system or dependency changes                  |
| `ci`       | CI configuration                                    |
| `chore`    | Maintenance and tooling                             |

Examples from this repository:

```text
feat(web): add client-side routing with react router
fix(web): target ipv4 api in dev proxy
test(web): cover navigation and not found routes
chore: configure eslint and prettier
```

There is no `add` type in Conventional Commits. Use `feat` for new behavior and
`chore` for tooling or maintenance.

## Troubleshooting

- **PowerShell blocks `pnpm` on Windows:** if `pnpm` fails with "running scripts
  is disabled", use `pnpm.cmd` (for example, `pnpm.cmd dev`) or run the commands
  in Command Prompt. Alternatively, allow local scripts for your user with
  `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
- **Port already in use:** both dev servers use strict ports (`3000` and
  `5173`). Stop the process holding the port or change it in the env file.
- **Docker is not running:** `pnpm db:up` fails when the Docker daemon is off.
  Start Docker Desktop (or your Docker service) and run it again.
- **Postgres port already in use:** change the host port in
  `docker-compose.yml` (for example `"5433:5432"`) and update `DATABASE_URL` to
  match.
- **Blocked install scripts:** pnpm approves build scripts explicitly. `esbuild`
  is allowed in `pnpm-workspace.yaml`; use `pnpm approve-builds` when adding
  another package that needs an install script.
- **Shared changes not visible:** rebuild the package with
  `pnpm build:shared` or restart `pnpm dev`.
