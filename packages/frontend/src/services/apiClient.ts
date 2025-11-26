/**
 * OpenAPI-fetch based API client
 * This replaces the axios-based client with type-safe API calls
 */
import createClient from 'openapi-fetch';
import type { paths } from '@rpg-gen/shared';
import { authService } from './authService';

const baseUrl = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

// Create the openapi-fetch client with proper typing
const client = createClient<paths>({
  baseUrl,
});

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
