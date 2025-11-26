import type { CharacterDto, GameResponse } from '@rpg-gen/shared';

import apiClient from './apiClient';

export class ConversationService {
  private characterId: string | null = null;

  /**
   * Start game linked to current character
   * Each character gets its own conversation history using their UUID as characterId
   */
  async startGame(character: CharacterDto) {
    if (!character) throw new Error('No character provided to startGame.');
    this.characterId = character.characterId;

    const histRes = await apiClient.GET(`/api/chat/{characterId}/history`, { params: { path: { characterId: this.characterId } } });
    return histRes.data;
  }

  /**
   * Send a message to the game backend
   */
  async sendMessage(message: string): Promise<GameResponse> {
    if (!this.characterId) throw new Error('Game not started. Call startGame first.');
    const res = await apiClient.post(`/chat/${this.characterId}`, { message });
    console.log(res);
    const result = res?.data;

    return {
      text: result.text || '',
      instructions: result.instructions || [],
      model: result.model,
      usage: result.usage,
    };
  }
}
export const conversationService = new ConversationService();
