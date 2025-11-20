/**
 * Shared game mechanics types used across frontend and backend
 */

/**
 * Chat message role types
 */
export type ChatRole = "system" | "user" | "assistant";

/**
 * Game instruction from backend parser
 */
export interface GameInstruction {
  type?: "roll" | "xp" | "hp" | "spell" | "inventory";
  data?: Record<string, unknown>;
  roll?: { 
    dices: string; 
    modifier?: string | number; 
    description?: string;
  };
  hp?: number; // HP change (positive or negative)
  xp?: number; // Experience points gained
  spell?: {
    action: "learn" | "cast" | "forget";
    name: string;
    level?: number;
    school?: string;
    description?: string;
  };
  inventory?: {
    action: "add" | "remove" | "use";
    name: string;
    quantity?: number;
    description?: string;
  };
}

/**
 * Roll instruction received from backend
 */
export interface RollInstruction {
  dices: string; // e.g. "1d20"
  modifier: string; // e.g. "Perception Check" - skill/check name
}

/**
 * Chat message with metadata
 */
export interface ChatMessage {
  role: ChatRole;
  text: string;
  timestamp?: number;
  meta?: Record<string, unknown>;
  instructions?: GameInstruction[];
}

/**
 * Game message for display (simplified version)
 */
export interface GameMessage {
  role: string;
  text: string;
}

/**
 * API response from game backend
 */
export interface GameResponse {
  text: string; // Narrative response from game master (Gemini)
  instructions: GameInstruction[]; // Parsed game instructions
  model: string; // Model used (e.g., "gemini-pro")
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Roll result with all details
 */
export interface RollResult {
  rolls: number[]; // Array of individual die rolls (e.g. [18] for d20)
  total: number; // Sum of rolls + bonus
  bonus: number; // Skill/ability modifier applied
  diceNotation: string; // e.g. "1d20"
  skillName: string; // Name of the skill/check (e.g. "Perception Check")
  advantage?: boolean; // Optional advantage flag
}

/**
 * Roll data for display in modal
 */
export interface RollModalData extends RollResult {
  isCritical?: boolean; // true if nat 20, false if nat 1
}
