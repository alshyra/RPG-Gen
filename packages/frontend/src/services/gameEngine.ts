import type { GameInstruction } from '@rpg/shared';
import type { ChatMessageDto as ChatMessage } from '@rpg/shared';
import axios from 'axios';
import { authService } from './authService';

type GameResponse = {
  text: string;
  instructions?: GameInstruction[];
  model?: string;
  usage?: Record<string, unknown> | null;
};

// Create axios instance with auth interceptor
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `${window.location.origin}/api`,
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
  response => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, logout and redirect to login
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export class GameEngine {
  private characterId: string | null = null;

  /**
   * Start game linked to current character
   * Each character gets its own conversation history using their UUID as characterId
   */
  async startGame(characterId: string): Promise<{ isNew: boolean; messages: ChatMessage[] }> {
    this.characterId = characterId;
    const histRes = await apiClient.get(`/conversation/${this.characterId}`);
    const ok = histRes?.data?.ok ?? true;
    if (!ok) {
      // Create conversation server-side using POST /api/conversation/:characterId
      const createRes = await apiClient.post(`/conversation/${this.characterId}`, {});
      const isNew = createRes?.data?.isNew || false;
      const history = createRes?.data?.history || [];
      return { isNew, messages: history };
    }
    const isNew = histRes?.data?.isNew || false;
    const history = histRes?.data?.history || [];

    return { isNew, messages: history };
  }

  /**
   * Send a message to the game backend
   */
  async sendMessage(characterId: string, message: string): Promise<GameResponse> {
    if (!this.characterId) throw new Error('Game not started. Call startGame first.');
    const res = await apiClient.post(`/conversation/${characterId}/message`, {
      message,
    });
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

    const rolls = Array.from({ length: numDice }, () => Math.floor(Math.random() * diceSize) + 1);
    const sum = rolls.reduce((acc, r) => acc + r, 0);
    const total = sum + staticBonus + modifier;

    return { rolls, total };
  }

  /**
   * Clear session (for cleanup)
   */
  endGame(): void {
    this.characterId = null;
  }
}

// Export singleton instance
export const gameEngine = new GameEngine();
