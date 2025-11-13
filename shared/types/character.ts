/**
 * Shared character types used across frontend and backend
 */

export interface Race {
  id: string;
  name: string;
  mods: Record<string, number>;
}

export interface AbilityScores {
  Str: number;
  Dex: number;
  Con: number;
  Int: number;
  Wis: number;
  Cha: number;
}

export interface CharacterClass {
  name: string;
  level: number;
}

export interface Skill {
  name: string;
  proficient: boolean;
  modifier: number;
}

export interface CharacterEntry {
  id: string; // UUID, also serves as sessionId for chat
  name: string;
  race: Race;
  scores: AbilityScores;
  hp: number; // Current HP
  hpMax: number; // Max HP derived from CON
  totalXp: number; // Cumulative experience points
  classes: CharacterClass[]; // Character classes and their levels
  skills?: Skill[];
  world: string; // Game universe (dnd, vtm, cyberpunk)
  worldId?: string; // Alternative world identifier
  portrait: string; // Image URL or path
  gender: "male" | "female";
  proficiency: number; // Proficiency bonus (default 2)
  [key: string]: any; // Allow additional properties for extensibility
}

export interface SavedCharacterEntry {
  id: string; // UUID
  data: CharacterEntry;
}

export interface DeceasedCharacterEntry {
  id: string;
  character: CharacterEntry;
  diedAt: string; // ISO string timestamp
  location: string; // Last location in game
}
