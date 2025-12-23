import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { Conversation } from '../../domain/conversation/entities/Conversation.js';
import { Message } from '../../domain/conversation/value-objects/Message.js';
import { IConversationRepository, CONVERSATION_REPOSITORY } from '../../domain/conversation/repositories/IConversationRepository.js';
import type { GameInstructionDto } from '../../domain/instruction/GameInstructionDto.js';

/**
 * Application service for Conversation data
 * Orchestrates conversation operations between domain and infrastructure
 * 
 * @application game-narrative
 */
@Injectable()
export class ConversationAppService {
  private readonly logger = new Logger(ConversationAppService.name);
  private readonly MAX_MESSAGES = Number(process.env.CONV_MAX_MESSAGES || '60');

  constructor(@Inject(CONVERSATION_REPOSITORY) private readonly conversationRepository: IConversationRepository) {}

  /**
   * Get or create a conversation for a user and character
   */
  async getOrCreateConversation(userId: string, characterId: string): Promise<Conversation> {
    let conversation = await this.conversationRepository.findByUserAndCharacter(userId, characterId);
    
    if (!conversation) {
      conversation = new Conversation({ userId, characterId });
      await this.conversationRepository.save(conversation);
    }

    return conversation;
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(
    userId: string,
    characterId: string,
    message: Message,
  ): Promise<Conversation> {
    const conversation = await this.getOrCreateConversation(userId, characterId);

    // Check message limit
    if (conversation.isAtLimit(this.MAX_MESSAGES)) {
      this.logger.warn(`Conversation at max limit (${this.MAX_MESSAGES})`);
      // Could implement sliding window or archival here
    }

    const updated = conversation.addMessage(message);
    await this.conversationRepository.save(updated);

    return updated;
  }

  /**
   * Get recent messages from a conversation
   */
  async getRecentMessages(userId: string, characterId: string, count: number = 10): Promise<Message[]> {
    const conversation = await this.conversationRepository.findByUserAndCharacter(userId, characterId);
    
    if (!conversation) {
      return [];
    }

    return conversation.getRecentMessages(count);
  }

  /**
   * Get all messages from a conversation
   */
  async getAllMessages(userId: string, characterId: string): Promise<Message[]> {
    const conversation = await this.conversationRepository.findByUserAndCharacter(userId, characterId);
    
    if (!conversation) {
      return [];
    }

    return [...conversation.messages];
  }

  /**
   * Clear conversation history
   */
  async clearConversation(userId: string, characterId: string): Promise<void> {
    await this.conversationRepository.delete(userId, characterId);
  }

  /**
   * Get user's conversations with all characters
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.findByUser(userId);
  }

  /**
   * Get messages for all users in a conversation with a character
   */
  async getCharacterConversations(characterId: string): Promise<Conversation[]> {
    return this.conversationRepository.findByCharacter(characterId);
  }
}
