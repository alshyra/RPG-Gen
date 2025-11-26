// Public entry for @rpg-gen/shared
// Re-export all generated DTOs
export * from './generated';

// Re-export proper types from the types folder (replacing 'any' fallbacks)
export type {
  GameInstruction,
  RollInstruction,
  ChatMessage,
  MessageMeta,
  GameMessage,
  GameResponse,
  RollResult,
  RollModalData,
  ChatRole,
  DisplayRole,
} from '../types/game';

export type {
  DndLevel,
  LevelUpResult,
} from '../types/dnd';

export type {
  ChatRequest,
  DiceRequest,
  ImageRequest,
  AvatarRequest,
} from '../types/api';

export type {
  Spell,
  InventoryItem,
} from '../types/character';

// CharacterDto-based types for frontend/backend interop
import type { CharacterDto } from './generated/character.dto';

export interface SavedCharacterEntry {
  id: string;
  data: CharacterDto;
}

export interface DeceasedCharacterEntry {
  id: string;
  character: CharacterDto;
  diedAt: string;
  location: string;
}

// Alias for backward compatibility
export type CharacterEntry = CharacterDto;
