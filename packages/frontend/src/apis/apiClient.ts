/**
 * OpenAPI-fetch based API client
 * This replaces the axios-based client with type-safe API calls
 *
 * Note: Until the backend controllers are updated with proper @ApiResponse decorators,
 * we use the shared types for response typing and openapi-fetch for the request handling.
 */
import createClient from 'openapi-fetch';
import type { paths } from '@rpg-gen/shared';
import { authService } from './authApi';

const baseUrl = window.location.origin;

// Create the openapi-fetch client with proper typing
const client = createClient<paths>({ baseUrl });

// Add auth middleware
client.use({
  onRequest: ({ request }) => {
    const token = authService.getToken();
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    return request;
  },
  onResponse: ({ response }) => {
    if (response.status === 401) {
      // Token expired or invalid, logout and redirect to login
      authService.logout();
      window.location.href = '/login';
    }
    return response;
  },
});

export default client;

// Re-export for convenience
export { client as api };
