import axios from 'axios';
import { authService } from './authService';

// Create axios instance with auth interceptor
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `${window.location.origin}/api`,
});

// Add auth token to all requests
apiClient.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  response => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, logout and redirect to login
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
