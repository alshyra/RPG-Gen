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

    const { data, error } = await apiClient.GET('/api/chat/{characterId}/history', {
      params: { path: { characterId: this.characterId } },
    });

    if (error) {
      throw new Error('Failed to load conversation history');
    }

    return data;
  }

  /**
   * Send a message to the game backend
   */
  async sendMessage(message: string): Promise<GameResponse> {
    if (!this.characterId) throw new Error('Game not started. Call startGame first.');

    const { data, error } = await apiClient.POST('/api/chat/{characterId}', {
      params: { path: { characterId: this.characterId } },
      body: { message },
    });

    if (error || !data) {
      throw new Error('Failed to send message');
    }

    return {
      text: data.text || '',
      instructions: data.instructions || [],
      model: data.model,
      usage: data.usage,
    };
  }
}
export const conversationService = new ConversationService();
