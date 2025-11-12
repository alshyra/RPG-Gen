import axios from 'axios';
import { characterService } from './characterService';

export interface GameInstruction {
  roll?: {
    dices: string;
    modifier?: string;
    modifierValue?: number;
    description?: string;
  };
  xp?: number;
  hp?: number;
}

export interface GameResponse {
  text: string;
  instructions: GameInstruction[];
  model?: string;
  usage?: any;
}

export interface ChatMessage {
  role: string;
  text: string;
}

export class GameEngine {
  private sessionId: string | null = null;

  /**
   * Initialize session linked to current character
   * Each character gets its own conversation history using their UUID as sessionId
   */
  async initSession(): Promise<{ isNew: boolean; messages: ChatMessage[] }> {
    // Get current character's UUID - this becomes the sessionId for conversation
    const char = characterService.getCurrentCharacter();
    if (!char) throw new Error('No current character found. Please create or load a character first.');
    this.sessionId = char.id;

    // Load conversation history for this character, passing character data for initialization
    const charParam = encodeURIComponent(JSON.stringify(char));
    const histRes = await axios.get(`/api/chat/history?sessionId=${this.sessionId}&character=${charParam}`);
    const isNew = histRes?.data?.isNew || false;
    const history = histRes?.data?.history || [];

    return { isNew, messages: history };
  }

  /**
   * Send a message to the game backend
   */
  async sendMessage(message: string): Promise<GameResponse> {
    if (!this.sessionId) throw new Error('Session not initialized. Call initSession first.');

    const char = characterService.getCurrentCharacter();
    const res = await axios.post('/api/chat', { message, sessionId: this.sessionId, character: char });
    const result = res?.data?.result || {};

    return {
      text: result.text || '',
      instructions: result.instructions || [],
      model: result.model,
      usage: result.usage,
    };
  }

  /**
   * Get character ability modifier
   */
  getAbilityModifier(character: any, abilityName: string): number {
    if (!character || !character.abilities) return 0;
    const score = character.abilities[abilityName.toLowerCase()] || 10;
    return Math.floor((score - 10) / 2);
  }

  /**
   * Roll dice and return result with optional modifier
   */
  rollDice(diceNotation: string, modifier: number = 0): { rolls: number[]; total: number } {
    const match = diceNotation.match(/^(\d+)d(\d+)(?:\+(\d+))?$/);
    if (!match) throw new Error(`Invalid dice notation: ${diceNotation}`);

    const numDice = parseInt(match[1], 10);
    const diceSize = parseInt(match[2], 10);
    const staticBonus = match[3] ? parseInt(match[3], 10) : 0;

    const rolls: number[] = [];
    for (let i = 0; i < numDice; i++) {
      rolls.push(Math.floor(Math.random() * diceSize) + 1);
    }

    const sum = rolls.reduce((acc, r) => acc + r, 0);
    const total = sum + staticBonus + modifier;

    return { rolls, total };
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Clear session (for cleanup)
   */
  clearSession(): void {
    this.sessionId = null;
  }
}

// Export singleton instance
export const gameEngine = new GameEngine();
