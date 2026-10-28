import { API_ROUTES, type HealthResponse } from "@repo/shared";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "") || "/api";

export async function fetchHealth(
  signal?: AbortSignal,
): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}${API_ROUTES.health}`, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return (await response.json()) as HealthResponse;
}
