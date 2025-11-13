/**
 * Shared API request/response types for RPG-Gen
 */

import type { CharacterEntry } from "./character";

/**
 * Chat request to backend
 */
export interface ChatRequest {
  message?: string;
  sessionId?: string;
  character?: CharacterEntry;
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
}
