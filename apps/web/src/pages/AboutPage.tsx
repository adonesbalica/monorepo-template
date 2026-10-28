import { Link } from "react-router-dom";

const workspaces = [
  {
    name: "apps/web",
    description:
      "React 19, Vite and React Router. Renders the status dashboard and proxies /api during development.",
  },
  {
    name: "apps/api",
    description:
      "Fastify 5 with validated environment variables, CORS, graceful shutdown and a health endpoint.",
  },
  {
    name: "packages/shared",
    description:
      "Framework-agnostic API contracts consumed by both apps so the response types cannot drift.",
  },
];

const commands = [
  { command: "pnpm dev", description: "Run the web app and API together" },
  { command: "pnpm test", description: "Run every test suite" },
  { command: "pnpm build", description: "Typecheck and build all packages" },
];

export default function AboutPage() {
  return (
    <article className="page">
      <header className="hero">
        <p className="eyebrow">About this starter</p>
        <h1>A monorepo with clear boundaries.</h1>
        <p className="lede">
          Each app owns its runtime, while contracts live in a shared package so
          the frontend and backend cannot drift apart silently.
        </p>
      </header>

      <div className="card-grid">
        {workspaces.map((workspace) => (
          <section className="card" key={workspace.name}>
            <h2>{workspace.name}</h2>
            <p>{workspace.description}</p>
          </section>
        ))}
      </div>

      <section className="card">
        <h2>Useful commands</h2>
        <ul className="commands">
          {commands.map((item) => (
            <li key={item.command}>
              <code>{item.command}</code>
              <span>{item.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="back-link">
        <Link className="button" to="/">
          Back to status
        </Link>
      </p>
    </article>
  );
}
