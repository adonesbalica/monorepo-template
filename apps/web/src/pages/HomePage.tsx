import { useEffect, useState } from "react";
import type { HealthResponse } from "@repo/shared";
import { fetchHealth } from "../lib/api";

type HealthState =
  | { status: "loading" }
  | { status: "online"; data: HealthResponse }
  | { status: "offline"; message: string };

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "medium",
});

function formatTimestamp(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

export default function HomePage() {
  const [state, setState] = useState<HealthState>({ status: "loading" });
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });

    fetchHealth(controller.signal)
      .then((data) => {
        setState({ status: "online", data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "offline",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      });

    return () => {
      controller.abort();
    };
  }, [requestId]);

  return (
    <>
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
          <StatusBadge state={state} />
        </div>

        {state.status === "loading" && <p>Checking the Fastify API…</p>}

        {state.status === "offline" && (
          <div className="empty">
            <p>{state.message}</p>
            <p className="hint">
              Start the API with <code>pnpm dev</code> and try again.
            </p>
          </div>
        )}

        {state.status === "online" && (
          <dl className="details">
            <div>
              <dt>Service</dt>
              <dd>{state.data.service}</dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>{state.data.version}</dd>
            </div>
            <div>
              <dt>Uptime</dt>
              <dd>{state.data.uptime}s</dd>
            </div>
            <div>
              <dt>Checked</dt>
              <dd>{formatTimestamp(state.data.timestamp)}</dd>
            </div>
          </dl>
        )}

        <div className="card__actions">
          <button
            type="button"
            className="button"
            onClick={() => setRequestId((id) => id + 1)}
            disabled={state.status === "loading"}
          >
            Refresh
          </button>
          <span className="endpoint">
            <code>GET /api/health</code>
          </span>
        </div>
      </section>
    </>
  );
}

function StatusBadge({ state }: { state: HealthState }) {
  if (state.status === "online") {
    return <span className="badge badge--online">Operational</span>;
  }

  if (state.status === "offline") {
    return <span className="badge badge--offline">API unreachable</span>;
  }

  return <span className="badge badge--pending">Checking</span>;
}
