import type { ConversationDto, GameInstruction } from '@rpg/shared';
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

export class ConversationService {
  private characterId: string | null = null;

  async getConversationById(characterId: string) {
    const res = await apiClient.get<ConversationDto>(`/conversation/${characterId}`);
    return res?.data;
  }

  /**
   * Start game linked to current character
   * Each character gets its own conversation history using their UUID as characterId
   */
  async startGame(characterId: string): Promise<{ isNew: boolean; messages: ChatMessage[] }> {
    this.characterId = characterId;
    const histRes = await apiClient.get(`/conversation/${this.characterId}`);
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
}

export const conversationService = new ConversationService();
