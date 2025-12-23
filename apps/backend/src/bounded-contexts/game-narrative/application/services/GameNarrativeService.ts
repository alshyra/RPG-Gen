import { Injectable, Logger } from '@nestjs/common';
import { NarrativeAppService } from './NarrativeAppService.js';
import { Message } from '../../domain/narrative/value-objects/Message.js';
import { Narrative } from '../../domain/narrative/entities/Narrative.js';
import { Context } from '../../domain/narrative/value-objects/Context.js';

/**
 * Facade service for game narrative
 * High-level orchestration for narrative gameplay
 * 
 * @application game-narrative
 */
@Injectable()
export class GameNarrativeService {
  private readonly logger = new Logger(GameNarrativeService.name);

  constructor(private readonly narrativeAppService: NarrativeAppService) {}

  /**
   * Get a narrative with all its data
   */
  async getNarrative(userId: string, characterId: string): Promise<Narrative> {
    return this.narrativeAppService.getNarrativeBySessionId(`${userId}_${characterId}`);
  }

  /**
   * Create or get narrative for a user and character
   */
  async getOrCreateNarrative(
    userId: string,
    characterId: string,
    sessionId: string,
    initialContext: Context,
  ): Promise<Narrative> {
    return this.narrativeAppService.getOrCreateNarrative(
      userId,
      characterId,
      sessionId,
      initialContext,
    );
  }

  /**
   * Add a message and retrieve recent history
   */
  async addMessageAndGetContext(
    userId: string,
    characterId: string,
    message: Message,
    count: number = 10,
  ): Promise<{ narrative: Narrative; recentMessages: Message[] }> {
    const narrative = await this.narrativeAppService.addMessage(userId, characterId, message);
    const recentMessages = narrative.getRecentMessages(count);

    return { narrative, recentMessages };
  }

  /**
   * Get narrative history
   */
  async getNarrativeHistory(userId: string, characterId: string): Promise<Message[]> {
    return this.narrativeAppService.getAllMessages(userId, characterId);
  }

  /**
   * Clear entire narrative
   */
  async clearNarrative(userId: string, characterId: string): Promise<void> {
    await this.narrativeAppService.clearNarrative(userId, characterId);
  }

  /**
   * Update narrative context
   */
  async updateContext(userId: string, characterId: string, newContext: Context): Promise<Narrative> {
    return this.narrativeAppService.updateContext(userId, characterId, newContext);
  }

  /**
   * Get instructions of a specific type
   */
  async getInstructionsByType(
    userId: string,
    characterId: string,
    type: string,
  ): Promise<ReadonlyArray<any>> {
    return this.narrativeAppService.getInstructionsByType(userId, characterId, type);
  }

  /**
   * Delete narrative
   */
  async deleteNarrative(userId: string, characterId: string): Promise<void> {
    await this.narrativeAppService.deleteNarrative(userId, characterId);
  }
}
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    return this.conversationService.getUserConversations(userId);
  }
}
