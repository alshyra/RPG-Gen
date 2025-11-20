import axios from 'axios';
import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  (error) => {
    if (error.response?.status === 401) {
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const generateAvatar = async (characterId: string): Promise<string> => {
  const response = await apiClient.post(`/image/${characterId}/generate-avatar`);
  return (response.data && response.data.imageUrl) || response.data;
};

export const imageServiceApi = { generateAvatar };
