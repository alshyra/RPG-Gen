/**
 * Shared API request/response types for RPG-Gen
 */

/**
 * Chat request to backend
 */
export interface ChatRequest {
  message?: string;
  characterId?: string;
  // Optional full character data used when initializing a new conversation
  character?: Record<string, unknown> | undefined;
}

/**
 * Dice roll request
 */
export interface DiceRequest {
  expr: string; // Dice expression like "1d6+2"
}

/**
 * Image generation request
 */
export interface ImageRequest {
  token?: string;
  prompt: string;
  model?: string;
}

/**
 * Avatar generation request
 */
export interface AvatarRequest {
  character?: {
    name?: string;
    gender?: string;
    race?: { name?: string };
    classes?: Array<{ name?: string }>;
  };
  description: string;
  characterId?: string; // Optional: If provided, saves avatar to this character
}
