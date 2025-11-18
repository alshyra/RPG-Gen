/**
 * CharacterService - Manages character persistence using localStorage only
 * Single source of truth: localStorage with UUID-based character IDs
 */

import type { CharacterEntry, SavedCharacterEntry, DeceasedCharacterEntry } from '@shared/types';

// Re-export for convenience
export type { SavedCharacterEntry, CharacterEntry, DeceasedCharacterEntry } from '../../../shared/types';

const STORAGE_KEYS = {
  savedCharacters: 'rpg-characters',
  currentCharacterId: 'rpg-character-id',
  deceasedCharacters: 'rpg-deceased-characters',
};

const generateUUID = (): string => crypto.randomUUID();

const getAllSavedCharacters = (): SavedCharacterEntry[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.savedCharacters);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Failed to load saved characters', e);
    return [];
  }
};

const loadCharacter = (): CharacterEntry | null => {
  const currentCharId = localStorage.getItem(STORAGE_KEYS.currentCharacterId);
  if (currentCharId) {
    const saved = getAllSavedCharacters();
    const found = saved.find(s => s.id === currentCharId);
    if (found?.data) {
      return found.data;
    }
  }

  return null;
};

const ensureCharacterHp = (character: CharacterEntry): void => {
  if (!character.hpMax && character.hp) character.hpMax = character.hp;
  if (!character.hpMax) character.hpMax = 12;
};

const saveCharacter = (character: CharacterEntry): string => {
  const charId = generateUUID();
  ensureCharacterHp(character);
  const saved = getAllSavedCharacters();
  saved.unshift({ id: charId, data: character });
  try {
    localStorage.setItem(STORAGE_KEYS.savedCharacters, JSON.stringify(saved));
    localStorage.setItem(STORAGE_KEYS.currentCharacterId, charId);
  } catch (e) {
    console.error('Failed to save character to localStorage', e);
  }
  return charId;
};

const updateCurrentCharacter = (character: CharacterEntry): void => {
  const saved = getAllSavedCharacters();

  if (saved.length === 0) return;

  // Update the most recent character
  saved[0].data = character;
  try {
    localStorage.setItem(STORAGE_KEYS.savedCharacters, JSON.stringify(saved));
  } catch (e) {
    console.error('Failed to update character in localStorage', e);
  }
};

const getCurrentCharacter = (): CharacterEntry | null => {
  const saved = getAllSavedCharacters();
  if (saved.length === 0) return null;
  const currentCharId = localStorage.getItem('rpg-character-id');
  if (!currentCharId) return null;
  const charData = saved.find(s => s.id === currentCharId)?.data;
  if (!charData) return null;

  // Ensure required fields exist with defaults
  const result: CharacterEntry = {
    ...charData,
    id: currentCharId,
    hp: charData.hp !== undefined ? charData.hp : charData.hpMax || 12,
    hpMax: charData.hpMax || charData.hp || 12,
    totalXp: charData.totalXp || 0,
    proficiency: charData.proficiency || 2,
    gender: charData.gender || 'male',
    spells: charData.spells || [],
    inventory: charData.inventory || [],
  };

  return result;
};

const deleteCharacter = (charId: string): void => {
  try {
    const saved = getAllSavedCharacters();
    const filtered = saved.filter(s => s.id !== charId);
    localStorage.setItem(STORAGE_KEYS.savedCharacters, JSON.stringify(filtered));

    // If this was the current character, clear it
    const currentCharId = localStorage.getItem(STORAGE_KEYS.currentCharacterId);
    if (currentCharId === charId) {
      localStorage.removeItem(STORAGE_KEYS.currentCharacterId);
    }
  } catch (e) {
    console.error('Failed to delete character', e);
  }
};

const setCurrentCharacterId = (charId: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.currentCharacterId, charId);
  } catch (e) {
    console.error('Failed to set current character ID', e);
  }
};

const getCurrentCharacterId = (): string | null =>
  localStorage.getItem(STORAGE_KEYS.currentCharacterId);

const clearCurrentCharacterId = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.currentCharacterId);
  } catch (e) {
    console.error('Failed to clear current character ID', e);
  }
};

const killCharacter = (charId: string, deathLocation?: string): void => {
  try {
    const char = getAllSavedCharacters().find(s => s.id === charId);
    if (!char) return;

    // Add death metadata
    const deceasedEntry: DeceasedCharacterEntry = {
      id: charId,
      character: char.data,
      diedAt: new Date().toISOString(),
      location: deathLocation || 'Unknown location',
    };

    // Add to deceased list
    const deceased = getDeceasedCharacters();
    deceased.unshift(deceasedEntry);
    localStorage.setItem(STORAGE_KEYS.deceasedCharacters, JSON.stringify(deceased));

    // Remove from active characters
    deleteCharacter(charId);
  } catch (e) {
    console.error('Failed to mark character as deceased', e);
  }
};

const getDeceasedCharacters = (): DeceasedCharacterEntry[] => {
  try {
    const deceased = localStorage.getItem(STORAGE_KEYS.deceasedCharacters);
    return deceased ? JSON.parse(deceased) : [];
  } catch (e) {
    console.error('Failed to load deceased characters', e);
    return [];
  }
};

const clearDeceased = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.deceasedCharacters);
  } catch (e) {
    console.error('Failed to clear deceased characters', e);
  }
};

/**
 * Draft management - for character creation in progress
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

export const characterService = {
  generateUUID,
  loadCharacter,
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
  clearDeceased,
  saveDraft,
  loadDraft,
  hasDraft,
  clearDraft,
};
