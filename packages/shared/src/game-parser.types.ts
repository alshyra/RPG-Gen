// Shared types for game parser and messages
export interface GameInstruction {
  type?: "roll" | "xp" | "hp" | "spell" | "inventory";
  data?: Record<string, unknown>;
  roll?: { dices: string; modifier?: string | number; description?: string };
  hp?: number;
  xp?: number;
  spell?: Record<string, unknown>;
  inventory?: Record<string, unknown>;
}

export interface GameMessage {
  role: string;
  text: string;
}

export interface GameResponse {
  text: string;
  instructions: GameInstruction[];
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}
