import axios from 'axios';
import { characterService } from './characterService';
import { authService } from './authService';
import type { GameResponse, ChatMessage } from '@shared/types';

// Create axios instance with auth interceptor
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost/api',
});

// Add auth token to all requests
apiClient.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, logout and redirect to login
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export class GameEngine {
  private sessionId: string | null = null;

  /**
   * Initialize session linked to current character
   * Each character gets its own conversation history using their UUID as sessionId
   */
  async initSession(): Promise<{ isNew: boolean; messages: ChatMessage[] }> {
    // Get current character's UUID - this becomes the sessionId for conversation
    const char = characterService.getCurrentCharacter();
    if (!char)
      throw new Error("No current character found. Please create or load a character first.");
    this.sessionId = char.id;

    // Load conversation history for this character, passing character data for initialization
    const charParam = encodeURIComponent(JSON.stringify(char));
    const histRes = await apiClient.get(
      `/chat/history?sessionId=${this.sessionId}&character=${charParam}`
    );
    const isNew = histRes?.data?.isNew || false;
    const history = histRes?.data?.history || [];

    return { isNew, messages: history };
  }

  /**
   * Send a message to the game backend
   */
  async sendMessage(message: string): Promise<GameResponse> {
    if (!this.sessionId) throw new Error("Session not initialized. Call initSession first.");

    const char = characterService.getCurrentCharacter();
    const res = await apiClient.post("/chat", {
      message,
      sessionId: this.sessionId,
      character: char,
    });
    const result = res?.data?.result || {};

    return {
      text: result.text || "",
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

    const rolls = Array.from({ length: numDice }, () => Math.floor(Math.random() * diceSize) + 1);
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
