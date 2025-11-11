/**
 * CharacterService - Manages character persistence using localStorage only
 * Single source of truth: localStorage with UUID-based character IDs
 */

const STORAGE_KEYS = {
  savedCharacters: 'rpg-characters',
  currentCharacterId: 'rpg-character-id',
  deceasedCharacters: 'rpg-deceased-characters',
};

export interface SavedCharacterEntry {
  id: string; // UUID
  data: any;
}

export interface CharacterEntry {
  id: string; // UUID
  name: string;
  race: {
      id: string;
      name: string;
      mods: { [key: string]: number };
  };
  scores: { [key: string]: number };
  hp: number;
  hpMax: number;
  totalXp: number;
  classes: { name: string; level: number }[];
  skills?: { name: string; proficient: boolean; modifier: number }[];
  world: string;
  worldId: string;
  portrait: string;
  gender: 'male' | 'female';
}

class CharacterService {
  /**
   * Generate a new UUID
   */
  private generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Load character from various sources in priority order:
   * 1. rpg-character-id from localStorage
   * 2. Most recent character overall (from localStorage)
   */
  loadCharacter(): any | null {
    const currentCharId = localStorage.getItem(STORAGE_KEYS.currentCharacterId);
    if (currentCharId) {
      const saved = this.getAllSavedCharacters();
      const found = saved.find(s => s.id === currentCharId);
      if (found?.data) {
        return found.data;
      }
    }

    return null;
  }

  /**
   * Save character to localStorage with a new UUID
   */
  saveCharacter(character: any): string {
    const charId = this.generateUUID();
    
    // Ensure required fields exist
    if (!character.hpMax && character.hp) {
      character.hpMax = character.hp;
    }
    if (!character.hpMax) {
      character.hpMax = 12; // default HP for level 1 character
    }
    
    // Save to localStorage
    const saved = this.getAllSavedCharacters();
    const entry: SavedCharacterEntry = { id: charId, data: character };
    saved.unshift(entry);
    try {
      localStorage.setItem(STORAGE_KEYS.savedCharacters, JSON.stringify(saved));
      // Set as current character
      localStorage.setItem(STORAGE_KEYS.currentCharacterId, charId);
    } catch (e) {
      console.error('Failed to save character to localStorage', e);
    }

    return charId;
  }

  /**
   * Update most recent character in localStorage (when stats change during gameplay)
   */
  updateCurrentCharacter(character: any): void {
    const saved = this.getAllSavedCharacters();
    
    if (saved.length === 0) return;

    // Update the most recent character
    saved[0].data = character;
    try {
      localStorage.setItem(STORAGE_KEYS.savedCharacters, JSON.stringify(saved));
    } catch (e) {
      console.error('Failed to update character in localStorage', e);
    }
  }

  /**
   * Get most recent character
   */
  getCurrentCharacter(): CharacterEntry | null {
    const saved = this.getAllSavedCharacters();
    if (saved.length === 0) return null;
    const currentCharId = localStorage.getItem('rpg-character-id');
    if (!currentCharId) return null;
    const charData = saved.find(s => s.id === currentCharId)?.data;
    if (!charData) return null;
    
    // Ensure required fields exist with defaults
    const result = {
      ...charData,
      id: currentCharId,
      hp: charData.hp !== undefined ? charData.hp : charData.hpMax || 12,
      hpMax: charData.hpMax || charData.hp || 12,
      totalXp: charData.totalXp || 0,
      proficiency: charData.proficiency || 2,
      gender: charData.gender || 'male',
    };
    
    return result;
  }

  /**
   * Get all saved characters from localStorage
   */
  getAllSavedCharacters(): SavedCharacterEntry[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.savedCharacters);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load saved characters', e);
      return [];
    }
  }

  /**
   * Delete a character from localStorage by ID
   */
  deleteCharacter(charId: string): void {
    try {
      const saved = this.getAllSavedCharacters();
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
  }

  /**
   * Set current character ID in localStorage
   */
  setCurrentCharacterId(charId: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.currentCharacterId, charId);
    } catch (e) {
      console.error('Failed to set current character ID', e);
    }
  }

  /**
   * Get current character ID from localStorage
   */
  getCurrentCharacterId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.currentCharacterId);
  }

  clearCurrentCharacterId(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.currentCharacterId);
    } catch (e) {
      console.error('Failed to clear current character ID', e);
    }
  }

  /**
   * Save character to deceased list and remove from active characters
   */
  killCharacter(charId: string, deathLocation?: string): void {
    try {
      const char = this.getAllSavedCharacters().find(s => s.id === charId);
      if (!char) return;

      // Add death metadata
      const deceasedEntry = {
        id: charId,
        character: char.data,
        diedAt: new Date().toISOString(),
        location: deathLocation || 'Unknown location',
      };

      // Add to deceased list
      const deceased = this.getDeceasedCharacters();
      deceased.unshift(deceasedEntry);
      localStorage.setItem(STORAGE_KEYS.deceasedCharacters, JSON.stringify(deceased));

      // Remove from active characters
      this.deleteCharacter(charId);
    } catch (e) {
      console.error('Failed to mark character as deceased', e);
    }
  }

  /**
   * Get all deceased characters
   */
  getDeceasedCharacters(): any[] {
    try {
      const deceased = localStorage.getItem(STORAGE_KEYS.deceasedCharacters);
      return deceased ? JSON.parse(deceased) : [];
    } catch (e) {
      console.error('Failed to load deceased characters', e);
      return [];
    }
  }

  /**
   * Clear deceased characters list
   */
  clearDeceased(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.deceasedCharacters);
    } catch (e) {
      console.error('Failed to clear deceased characters', e);
    }
  }
}

export const characterService = new CharacterService();
