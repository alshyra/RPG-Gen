/**
 * Shared game mechanics types used across frontend and backend
 */

/**
 * Chat message role types for Gemini API
 */
export type ChatRole = "system" | "user" | "assistant";

/**
 * Extended role type for UI display (includes GM, Player, Error, etc.)
 * Includes known roles explicitly for autocomplete, with string fallback
 * for backwards compatibility with database records.
 */
export type DisplayRole = ChatRole | "GM" | "Player" | "Error" | "model" | "System" | (string & Record<never, never>);

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
    advantage?: 'advantage' | 'disadvantage' | 'none';
  };
  hp?: number; // HP change (positive or negative)
  xp?: number; // Experience points gained
  spell?: SpellInstruction;
  inventory?: InventoryInstruction;
}

/**
 * Spell instruction from game parser
 */
export interface SpellInstruction {
  action: "learn" | "cast" | "forget";
  name: string;
  level?: number;
  school?: string;
  description?: string;
}

/**
 * Inventory instruction from game parser
 */
export interface InventoryInstruction {
  action: "add" | "remove" | "use";
  name: string;
  quantity?: number;
  description?: string;
}

/**
 * Roll instruction received from backend
 */
export interface RollInstruction {
  dices: string; // e.g. "1d20"
  modifier: string; // e.g. "Perception Check" - skill/check name
}

/**
 * Message metadata (model/usage info from API)
 */
export interface MessageMeta {
  usage?: Record<string, unknown>;
  model?: string;
}

/**
 * Chat message with metadata
 */
export interface ChatMessage {
  role: DisplayRole;
  text: string;
  timestamp: number;
  meta?: MessageMeta;
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
  advantage?: 'advantage' | 'disadvantage' | 'none'; // Optional advantage flag
  keptRoll?: number; // For advantage/disadvantage, the roll that was kept
  discardedRoll?: number; // For advantage/disadvantage, the roll that was discarded
}

/**
 * Roll data for display in modal
 */
export interface RollModalData extends RollResult {
  isCritical?: boolean; // true if nat 20, false if nat 1
}
