/**
 * Character API Service - Communicates with backend for character persistence
 */

import axios from 'axios';
import { authService } from './authService';
import type { CharacterEntry, SavedCharacterEntry, DeceasedCharacterEntry } from '@shared/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const generateUUID = (): string => crypto.randomUUID();

const getAllSavedCharacters = async (): Promise<SavedCharacterEntry[]> => {
  try {
    const response = await apiClient.get('/characters');
    const characters = response.data.characters || [];
    return characters.map((char: CharacterEntry) => ({
      id: char.id,
      data: char,
    }));
  } catch (e) {
    console.error('Failed to load characters from API', e);
    return [];
  }
};

const saveCharacter = async (character: CharacterEntry): Promise<string> => {
  try {
    const charId = character.id || generateUUID();
    const charWithId = { ...character, id: charId };
    
    await apiClient.post('/characters', charWithId);
    
    // Also save current character ID in localStorage for quick access
    localStorage.setItem('rpg-character-id', charId);
    
    return charId;
  } catch (e) {
    console.error('Failed to save character to API', e);
    throw e;
  }
};

const updateCurrentCharacter = async (character: CharacterEntry): Promise<void> => {
  try {
    if (!character.id) {
      throw new Error('Character must have an ID to update');
    }
    
    await apiClient.put(`/characters/${character.id}`, character);
  } catch (e) {
    console.error('Failed to update character in API', e);
    throw e;
  }
};

const getCurrentCharacter = async (): Promise<CharacterEntry | null> => {
  try {
    const currentCharId = localStorage.getItem('rpg-character-id');
    if (!currentCharId) return null;
    
    const response = await apiClient.get(`/characters/${currentCharId}`);
    return response.data.character || null;
  } catch (e) {
    console.error('Failed to get current character from API', e);
    return null;
  }
};

const deleteCharacter = async (charId: string): Promise<void> => {
  try {
    await apiClient.delete(`/characters/${charId}`);
    
    // If this was the current character, clear it
    const currentCharId = localStorage.getItem('rpg-character-id');
    if (currentCharId === charId) {
      localStorage.removeItem('rpg-character-id');
    }
  } catch (e) {
    console.error('Failed to delete character from API', e);
    throw e;
  }
};

const setCurrentCharacterId = (charId: string): void => {
  try {
    localStorage.setItem('rpg-character-id', charId);
  } catch (e) {
    console.error('Failed to set current character ID', e);
  }
};

const getCurrentCharacterId = (): string | null =>
  localStorage.getItem('rpg-character-id');

const clearCurrentCharacterId = (): void => {
  try {
    localStorage.removeItem('rpg-character-id');
  } catch (e) {
    console.error('Failed to clear current character ID', e);
  }
};

const killCharacter = async (charId: string, deathLocation?: string): Promise<void> => {
  try {
    await apiClient.post(`/characters/${charId}/kill`, { deathLocation });
    
    // Remove from current character if it's the one that died
    const currentCharId = localStorage.getItem('rpg-character-id');
    if (currentCharId === charId) {
      localStorage.removeItem('rpg-character-id');
    }
  } catch (e) {
    console.error('Failed to mark character as deceased in API', e);
    throw e;
  }
};

const getDeceasedCharacters = async (): Promise<DeceasedCharacterEntry[]> => {
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

/**
 * Draft management - still uses localStorage since drafts are temporary
 */
const DRAFT_KEY = 'rpg-character-draft';

const saveDraft = (draftData: any): void => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
  } catch (e) {
    console.error('Failed to save character draft', e);
  }
};

const loadDraft = (): any | null => {
  try {
    const draft = localStorage.getItem(DRAFT_KEY);
    return draft ? JSON.parse(draft) : null;
  } catch (e) {
    console.error('Failed to load character draft', e);
    return null;
  }
};

const hasDraft = (): boolean => {
  try {
    return !!localStorage.getItem(DRAFT_KEY);
  } catch {
    return false;
  }
};

const clearDraft = (): void => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (e) {
    console.error('Failed to clear character draft', e);
  }
};

// Synchronous version for compatibility with existing code
const loadCharacter = (): CharacterEntry | null => {
  // This is a synchronous wrapper that returns cached data
  // The actual data should be loaded asynchronously using getCurrentCharacter()
  return null;
};

export const characterServiceApi = {
  generateUUID,
  loadCharacter, // Deprecated - use getCurrentCharacter()
  saveCharacter,
  updateCurrentCharacter,
  getCurrentCharacter,
  getAllSavedCharacters,
  deleteCharacter,
  setCurrentCharacterId,
  getCurrentCharacterId,
  clearCurrentCharacterId,
  killCharacter,
  getDeceasedCharacters,
  saveDraft,
  loadDraft,
  hasDraft,
  clearDraft,
};
