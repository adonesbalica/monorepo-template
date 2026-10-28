import { fireEvent, render, screen } from "@testing-library/react";
import type { HealthResponse } from "@repo/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const health: HealthResponse = {
  status: "ok",
  service: "api",
  version: "0.1.0",
  timestamp: "2026-01-01T12:00:00.000Z",
  uptime: 42,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the api health status", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(health));
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    expect(await screen.findByText("Operational")).toBeInTheDocument();
    expect(screen.getByText("api")).toBeInTheDocument();
    expect(screen.getByText("0.1.0")).toBeInTheDocument();
    expect(screen.getByText("42s")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/health$/),
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
  });

  it("shows the api error message when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network down")));

    render(<App />);

    expect(await screen.findByText("API unreachable")).toBeInTheDocument();
    expect(screen.getByText("Network down")).toBeInTheDocument();
  });

  it("reports a non-2xx response as an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "nope" }, 503)),
    );

    render(<App />);

    expect(await screen.findByText("API unreachable")).toBeInTheDocument();
    expect(
      screen.getByText("Health check failed with status 503"),
    ).toBeInTheDocument();
  });

  it("refreshes the health status on demand", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(health))
      .mockResolvedValueOnce(jsonResponse({ ...health, uptime: 99 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    await screen.findByText("Operational");
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    expect(await screen.findByText("99s")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
