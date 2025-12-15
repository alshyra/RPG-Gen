import type { ChatMessageDto } from '@rpg-gen/shared';
import { apiClient, getData } from './index.js';

export const chatApi = {
  /**
   * Send a chat message
   */
  async sendMessage(characterId: string, message: ChatMessageDto): Promise<ChatMessageDto> {
    const response = await apiClient.POST('/api/chat/{characterId}', {
      params: { path: { characterId } },
      body: message,
    });
    return getData(response);
  },

  /**
   * Get conversation history
   */
  async getHistory(characterId: string): Promise<ChatMessageDto[]> {
    const response = await apiClient.GET('/api/chat/{characterId}/history', {
      params: { path: { characterId } },
    });
    return getData(response);
  },
};
