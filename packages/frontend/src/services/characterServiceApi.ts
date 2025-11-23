import type { CharacterDto, DeceasedCharacterEntry } from '@rpg-gen/shared';
import axios from 'axios';
import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

// Create axios instance with auth interceptor
const apiClient = axios.create({
  baseURL: API_URL,
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
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

const createCharacter = async (character: Partial<CharacterDto>) => {
  try {
    return (await apiClient.post<CharacterDto>('/characters', character)).data;
  } catch (e) {
    console.error('Failed to create character in API', e);
    throw e;
  }
};

const getAllSavedCharacters = async () => {
  try {
    const response = await apiClient.get<CharacterDto[]>('/characters');
    return response.data;
  } catch (e) {
    console.error('Failed to load characters from API', e);
    return [];
  }
};

const saveCharacter = async (characterId: string, character: Partial<CharacterDto>) => {
  try {
    const res = await apiClient.put<CharacterDto>(`/characters/${characterId}`, character);
    return res.data;
  } catch (e) {
    console.error('Failed to save character to API', e);
    throw e;
  }
};

const getCharacterById = async (characterId: string) => {
  try {
    const response = await apiClient.get<CharacterDto>(`/characters/${characterId}`);
    return response.data;
  } catch (e) {
    console.error('Failed to get current character from API', e);
    return null;
  }
};

const deleteCharacter = async (charId: string): Promise<void> => {
  try {
    await apiClient.delete(`/characters/${charId}`);
  } catch (e) {
    console.error('Failed to delete character from API', e);
    throw e;
  }
};

const killCharacter = async (charId: string, deathLocation?: string): Promise<void> => {
  try {
    await apiClient.post(`/characters/${charId}/kill`, { deathLocation });
  } catch (e) {
    console.error('Failed to mark character as deceased in API', e);
    throw e;
  }
};

const getDeceasedCharacters = async (): Promise<DeceasedCharacterEntry[]> => {
  try {
    const response = await apiClient.get('/characters/deceased');
    return response.data;
  } catch (e) {
    console.error('Failed to load deceased characters from API', e);
    return [];
  }
};

const generateAvatar = async (characterId: string): Promise<string> => {
  try {
    const response = await apiClient.post<{ imageUrl: string }>('/image/generate-avatar', { characterId });
    return response.data.imageUrl;
  } catch (e) {
    console.error('Failed to generate avatar for character', e);
    throw e;
  }
};

const grantInspiration = async (characterId: string, amount = 1): Promise<CharacterDto> => {
  try {
    const response = await apiClient.post<{ character: CharacterDto }>(`/characters/${characterId}/inspiration/grant`, { amount });
    return response.data.character;
  } catch (e) {
    console.error('Failed to grant inspiration to character', e);
    throw e;
  }
};

const spendInspiration = async (characterId: string): Promise<CharacterDto> => {
  try {
    const response = await apiClient.post<{ character: CharacterDto }>(`/characters/${characterId}/inspiration/spend`);
    return response.data.character;
  } catch (e) {
    console.error('Failed to spend inspiration for character', e);
    throw e;
  }
};

export const characterServiceApi = {
  generateAvatar,
  getCharacterById,
  createCharacter,
  saveCharacter,
  getAllSavedCharacters,
  deleteCharacter,
  killCharacter,
  getDeceasedCharacters,
  grantInspiration,
  spendInspiration,
  // Inventory API
  addInventoryItem: async (characterId: string, item: Partial<any>) => {
    try {
      const res = await apiClient.post<CharacterDto>(`/characters/${characterId}/inventory`, item);
      return res.data;
    } catch (e) {
      console.error('Failed to add inventory item', e);
      throw e;
    }
  },
  updateInventoryItem: async (characterId: string, itemId: string, updates: Partial<any>) => {
    try {
      const res = await apiClient.patch<CharacterDto>(`/characters/${characterId}/inventory/${itemId}`, updates);
      return res.data;
    } catch (e) {
      console.error('Failed to update inventory item', e);
      throw e;
    }
  },
  removeInventoryItem: async (characterId: string, itemId: string, qty?: number) => {
    try {
      // axios.delete with body requires specifying data in config
      const res = await apiClient.delete<CharacterDto>(`/characters/${characterId}/inventory/${itemId}`, { data: { qty } });
      return res.data;
    } catch (e) {
      console.error('Failed to remove inventory item', e);
      throw e;
    }
  },
};
