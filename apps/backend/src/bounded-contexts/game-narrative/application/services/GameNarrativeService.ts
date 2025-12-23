import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConversationAppService } from './ConversationAppService.js';
import { NarrativeContextAppService } from './NarrativeContextAppService.js';
import { Message } from '../../domain/conversation/value-objects/Message.js';
import { Conversation } from '../../domain/conversation/entities/Conversation.js';
import { NarrativeContext } from '../../domain/narrative/entities/NarrativeContext.js';
import { GameInstruction } from '../../instruction/GameInstruction.js';

/**
 * Facade service for game narrative
 * Combines conversation and narrative context management
 * 
 * @application game-narrative
 */
@Injectable()
export class GameNarrativeService {
  private readonly logger = new Logger(GameNarrativeService.name);

  constructor(
    private readonly conversationService: ConversationAppService,
    private readonly narrativeContextService: NarrativeContextAppService,
  ) {}

  /**
   * Get a conversation with full narrative context
   */
  async getConversationWithContext(
    userId: string,
    characterId: string,
  ): Promise<{ conversation: Conversation; narrative?: NarrativeContext }> {
    const conversation = await this.conversationService.getOrCreateConversation(userId, characterId);
    const sessionId = `${userId}_${characterId}`;
    const narrative = await this.narrativeContextService.contextRepository
      .findBySessionId(sessionId)
      .catch(() => undefined);

    return { conversation, narrative };
  }

  /**
   * Add a message and retrieve recent history for narrative context
   */
  async addMessageAndGetContext(
    userId: string,
    characterId: string,
    message: Message,
    count: number = 10,
  ): Promise<{ conversation: Conversation; recentMessages: Message[] }> {
    const conversation = await this.conversationService.addMessage(userId, characterId, message);
    const recentMessages = await this.conversationService.getRecentMessages(userId, characterId, count);

    return { conversation, recentMessages };
  }

  /**
   * Get conversation history for narrative engine
   */
  async getConversationHistory(userId: string, characterId: string): Promise<Message[]> {
    return this.conversationService.getAllMessages(userId, characterId);
  }

  /**
   * Clear entire conversation
   */
  async clearConversation(userId: string, characterId: string): Promise<void> {
    await this.conversationService.clearConversation(userId, characterId);
  }

  /**
   * Get all user conversations
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    return this.conversationService.getUserConversations(userId);
  }
}
