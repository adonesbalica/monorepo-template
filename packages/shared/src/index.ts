/**
 * API contracts shared by the backend and the frontend.
 * Keep this package free of runtime dependencies so it can be used anywhere.
 */

export const API_ROUTES = {
  health: "/health",
} as const;

export type ApiRoute = (typeof API_ROUTES)[keyof typeof API_ROUTES];

export type HealthStatus = "ok" | "degraded";

export interface HealthResponse {
  status: HealthStatus;
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}
