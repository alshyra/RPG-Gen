/**
 * CharacterDto API Service - Communicates with backend for character persistence
 */

import axios from 'axios';
import { authService } from './authService';
import type { CharacterDto as CharacterDto } from '@rpg/shared';

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

const getAllSavedCharacters = async (): Promise<CharacterDto[]> => {
  try {
    const response = await apiClient.get<CharacterDto[]>('/characters');
    return response.data as CharacterDto[];
  } catch (e) {
    console.error('Failed to load characters from API', e);
    return [];
  }
};

const createCharacter = async (character: Partial<CharacterDto>): Promise<CharacterDto> => {
  try {
    return (await apiClient.post<CharacterDto>('/characters', character)).data as CharacterDto;
  } catch (e) {
    console.error('Failed to create character in API', e);
    throw e;
  }
};

const updateCharacter = async (character: CharacterDto): Promise<void> => {
  try {
    if (!character.characterId) {
      throw new Error('CharacterDto must have an ID to update');
    }
    const charId = character.characterId;
    await apiClient.put(`/characters/${charId}`, character);
  } catch (e) {
    console.error('Failed to update character in API', e);
    throw e;
  }
};

const getCharacterById = async (characterId: string): Promise<CharacterDto> => {
  const response = await apiClient.get<CharacterDto>(`/characters/${characterId}`);
  if (!response.data) throw new Error('CharacterDto not found');
  // Backend returns `{ ok: true, character }` — normalize to return the character object
  const data = response.data as any;
  if (data.character) return data.character as CharacterDto;
  return data as CharacterDto;
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

const getDeceasedCharacters = async (): Promise<CharacterDto[]> => {
  try {
    const response = await apiClient.get('/characters/deceased');
    const characters = response.data.characters || [];
    return characters.map((char: any) => ({
      id: char.id,
      character: char,
      diedAt: char.diedAt,
      location: char.deathLocation || 'Unknown location',
    }));
  } catch (e) {
    console.error('Failed to load deceased characters from API', e);
    return [];
  }
};

const hasDraft = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/characters');
    const characters: CharacterDto[] = response.data || response.data.characters || [];
    return characters.some((c: any) => c?.state === 'draft');
  } catch {
    return false;
  }
};

export const characterServiceApi = {
  createCharacter,
  updateCharacter,
  getCharacterById,
  getAllSavedCharacters,
  deleteCharacter,
  killCharacter,
  getDeceasedCharacters,
  hasDraft,
};
