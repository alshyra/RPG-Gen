import createClient from "openapi-fetch";
import type { paths } from "@rpg-gen/shared";

/**
 * Base API client configuration
 */
export function createApiClient(baseUrl: string) {
  const client = createClient<paths>({
    baseUrl,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Add request interceptor to inject JWT token from localStorage
  client.use({
    async onRequest({ request }) {
      // Check if we're in a browser environment
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        const token = localStorage.getItem("auth_token");
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      }
      return request;
    },
  });

  return client;
}

/**
 * Default client for the application
 * Uses VITE_API_URL in dev, window.location.origin in prod
 */
export const apiClient = createApiClient(
  // @ts-ignore - import.meta.env is Vite-specific
  import.meta.env?.VITE_API_URL ||
    // @ts-ignore - window is browser-specific
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3001"),
);

/**
 * Helper to extract data from API response
 * Throws if response is an error
 */
export function getData<T>(response: { data?: T; error?: unknown }): T {
  if (response.error) {
    throw new Error(
      typeof response.error === "object" && response.error !== null
        ? JSON.stringify(response.error)
        : String(response.error),
    );
  }
  if (!response.data) {
    throw new Error("No data in response");
  }
  return response.data;
}

// Re-export types for convenience
export type { paths } from "@rpg-gen/shared";
