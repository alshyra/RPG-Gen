import createClient from "openapi-fetch";
import type { paths } from "@rpg-gen/shared";

/**
 * Base API client configuration
 */
export function createApiClient(baseUrl: string) {
  return createClient<paths>({
    baseUrl,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Default client for the application
 * Uses VITE_API_URL in dev, window.location.origin in prod
 */
export const apiClient = createApiClient(
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - import.meta.env is Vite-specific
  import.meta.env?.VITE_API_URL ||
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

/**
 * Helper for authenticated requests
 * Returns a client with Authorization header
 */
export function createAuthenticatedClient(token: string, baseUrl = "http://localhost:3001") {
  const client = createApiClient(baseUrl);
  return {
    ...client,
    GET: (url: Parameters<typeof client.GET>[0], init?: Parameters<typeof client.GET>[1]) =>
      client.GET(url, {
        ...init,
        headers: { ...init?.headers, Authorization: `Bearer ${token}` },
      }),
    POST: (url: Parameters<typeof client.POST>[0], init?: Parameters<typeof client.POST>[1]) =>
      client.POST(url, {
        ...init,
        headers: { ...init?.headers, Authorization: `Bearer ${token}` },
      }),
    PUT: (url: Parameters<typeof client.PUT>[0], init?: Parameters<typeof client.PUT>[1]) =>
      client.PUT(url, {
        ...init,
        headers: { ...init?.headers, Authorization: `Bearer ${token}` },
      }),
    DELETE: (
      url: Parameters<typeof client.DELETE>[0],
      init?: Parameters<typeof client.DELETE>[1],
    ) =>
      client.DELETE(url, {
        ...init,
        headers: { ...init?.headers, Authorization: `Bearer ${token}` },
      }),
    PATCH: (url: Parameters<typeof client.PATCH>[0], init?: Parameters<typeof client.PATCH>[1]) =>
      client.PATCH(url, {
        ...init,
        headers: { ...init?.headers, Authorization: `Bearer ${token}` },
      }),
  };
}

// Re-export types for convenience
export type { paths } from "@rpg-gen/shared";
