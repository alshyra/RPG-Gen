// Public entry for @rpg-gen/shared
// Re-export all generated DTOs
export * from './generated';

// Legacy type aliases to avoid mass code changes during migration
import type { CharacterDto } from './generated/character.dto';
import type { ChatMessageDto } from './generated/chatmessage.dto';
// Some generated DTO groups might not exist yet (game.types, api.types, dnd.types).
// Provide fallback type aliases (any) so consumers compile and we can migrate incrementally.
// When generator produces these, we can remove fallback types.
export type GameInstruction = any;
export type LevelUpResult = any;
export type DndLevel = any;
export type ChatRole = 'user' | 'assistant' | 'system';
export type DiceRequest = any;
export type ImageRequest = any;
export type AvatarRequest = any;
export type ChatRequest = any;
export type GameResponse = any;
export type GameMessage = any;
export type Spell = any;
export type InventoryItem = any;
export type RollInstruction = any;
export type RollResult = any;
export type RollModalData = any;

// Map old names to DTOs
export type CharacterEntry = CharacterDto;

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

export type ChatMessage = ChatMessageDto & { instructions?: GameInstruction[] };

// game/api/dnd DTO types are currently provided as fallback aliases above. When the generator
// creates the actual types we will re-export them from `generated/` and remove the fallbacks.
