/**
 * Shared game mechanics types used across frontend and backend
 */

export interface GameInstruction {
  roll?: {
    dices: string; // e.g., "1d20", "2d6+3"
    modifier?: number;
  };
  xp?: number; // Experience points gained
  hp?: number; // HP change (positive or negative)
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  text: string;
  instructions?: GameInstruction[];
}

export interface GameResponse {
  text: string; // Narrative response from game master (Gemini)
  instructions: GameInstruction[]; // Parsed game instructions
  model: string; // Model used (e.g., "gemini-pro")
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface RollResult {
  rolls: number[];
  total: number;
  bonus: number;
  diceNotation: string;
  skillName: string;
}

export interface RollModalData extends RollResult {
  isCritical?: boolean; // true if nat 20, false if nat 1
}
