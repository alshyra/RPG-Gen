export * from './api-types'

// Type aliases for backward compatibility
// These map the new OpenAPI-generated types to familiar names
export type CharacterDto = import('./api-types').components['schemas']['CharacterResponseDto'];
export type DeceasedCharacterDto = import('./api-types').components['schemas']['DeceasedCharacterResponseDto'];
export type ItemDto = import('./api-types').components['schemas']['ItemResponseDto'];
export type SpellDto = import('./api-types').components['schemas']['SpellResponseDto'];
export type RaceDto = import('./api-types').components['schemas']['RaceResponseDto'];
export type AbilityScoresDto = import('./api-types').components['schemas']['AbilityScoresResponseDto'];
export type CharacterClassDto = import('./api-types').components['schemas']['CharacterClassResponseDto'];
export type SkillDto = import('./api-types').components['schemas']['SkillResponseDto'];
export type ChatMessage = import('./api-types').components['schemas']['ChatMessageDto'];
export type ChatResponse = import('./api-types').components['schemas']['ChatResponseDto'];
export type GameInstruction = import('./api-types').components['schemas']['GameInstructionDto'];
export type SpellInstruction = import('./api-types').components['schemas']['SpellInstructionDataDto'];
export type InventoryInstruction = import('./api-types').components['schemas']['InventoryInstructionDataDto'];
export type MessageMeta = import('./api-types').components['schemas']['MessageMetaDto'];
export type DiceThrow = import('./api-types').components['schemas']['DiceThrowDto'];
export type CreateInventoryItemDto = import('./api-types').components['schemas']['CreateInventoryItemDto'];
export type ImageRequest = import('./api-types').components['schemas']['ImageRequestDto'];
export type ChatRequest = import('./api-types').components['schemas']['ChatRequestDto'];
export type AuthProfileDto = import('./api-types').components['schemas']['AuthProfileDto'];
export type UpdateCharacterRequestDto = import('./api-types').components['schemas']['UpdateCharacterRequestDto'];

// Legacy alias for backward compatibility
export type DiceThrowDto = DiceThrow;

// RollInstruction with corrected modifier type (OpenAPI can't properly represent string | number)
export interface RollInstruction {
  dices: string;
  modifier?: string | number;
  description?: string;
  advantage?: 'advantage' | 'disadvantage' | 'none';
}

// ChatRole type for convenience
export type ChatRole = 'user' | 'assistant' | 'system';

// For DeceasedCharacterEntry which includes extra fields
export interface DeceasedCharacterEntry {
  id: string;
  character: CharacterDto;
  diedAt: string;
  location: string;
}

// DnD level types (not in OpenAPI spec)
export interface DndLevel {
  level: number;
  totalXp: number;
  proficiencyBonus: number;
}

export interface LevelUpResult {
  oldLevel?: number;
  newLevel: number;
  hpIncrease?: number;
  proficiencyIncrease?: number;
  success?: boolean;
  hpGain?: number;
  hasASI?: boolean;
  newFeatures?: string[];
  proficiencyBonus?: number;
  message?: string;
}

// RollModalData for frontend - includes all fields used in the UI
export interface RollModalData {
  dices?: string;
  modifier?: string | number;
  description?: string;
  advantage?: 'advantage' | 'disadvantage' | 'none';
  show?: boolean;
  // UI specific fields
  skillName?: string;
  rolls?: number[];
  bonus?: number;
  total?: number;
  diceNotation?: string;
  keptRoll?: number;
  discardedRoll?: number;
}

// Legacy types for backward compatibility
export interface SavedCharacterEntry {
  id: string;
  data?: CharacterDto;
  character?: CharacterDto;
}

// Roll result type
export interface RollResult {
  rolls: number[];
  mod: number;
  total: number;
  advantage?: 'advantage' | 'disadvantage' | 'none';
  keptRoll?: number;
  discardedRoll?: number;
}

// GameResponse from chat API
export interface GameResponse {
  text: string;
  instructions: GameInstruction[];
  model: string;
  usage?: Record<string, unknown>;
  raw?: unknown;
}