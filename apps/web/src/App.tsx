import "./App.css";

export default function App() {
  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">Monorepo template</p>
        <h1>React + Fastify, ready to ship.</h1>
        <p className="lede">
          A small, strictly typed monorepo with shared contracts, a Vite-powered
          React frontend and a Fastify API.
        </p>
      </header>

      <section className="card" aria-live="polite">
        <div className="card__header">
          <h2>API status</h2>
          <span className="badge badge--pending">Connecting</span>
        </div>
        <p>The health check will appear here once the frontend is connected.</p>
      </section>

      <footer className="footer" aria-label="Workspace packages">
        <span>apps/web</span>
        <span>apps/api</span>
        <span>packages/shared</span>
      </footer>
    </main>
  );
}
