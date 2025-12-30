import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { Narrative } from '../../domain/narrative/entities/Narrative.js';
import { Message } from '../../domain/narrative/value-objects/Message.js';
import { Context } from '../../domain/narrative/value-objects/Context.js';
import { INarrativeRepository, NARRATIVE_REPOSITORY } from '../../domain/narrative/repositories/INarrativeRepository.js';

/**
 * Application service for Narrative
 * Orchestrates narrative operations between domain and infrastructure
 * 
 * @application game-narrative
 */
@Injectable()
export class NarrativeAppService {
  private readonly logger = new Logger(NarrativeAppService.name);
  private readonly MAX_MESSAGES = Number(process.env.CONV_MAX_MESSAGES || '60');

  constructor(@Inject(NARRATIVE_REPOSITORY) private readonly narrativeRepository: INarrativeRepository) {}

  /**
   * Get or create a narrative for a user and character
   */
  async getOrCreateNarrative(
    userId: string,
    characterId: string,
    sessionId: string,
    initialContext: Context,
  ): Promise<Narrative> {
    let narrative = await this.narrativeRepository.findByUserAndCharacter(userId, characterId);
    
    if (!narrative) {
      narrative = new Narrative({
        userId,
        characterId,
        sessionId,
        context: initialContext,
      });
      await this.narrativeRepository.save(narrative);
    }

    return narrative;
  }

  /**
   * Find narrative by session ID
   */
  async getNarrativeBySessionId(sessionId: string): Promise<Narrative> {
    const narrative = await this.narrativeRepository.findBySessionId(sessionId);
    if (!narrative) {
      throw new NotFoundException(`Narrative with session ${sessionId} not found`);
    }
    return narrative;
  }

  /**
   * Add a message to the narrative
   */
  async addMessage(
    userId: string,
    characterId: string,
    message: Message,
  ): Promise<Narrative> {
    const narrative = await this.narrativeRepository.findByUserAndCharacter(userId, characterId);
    if (!narrative) {
      throw new NotFoundException(
        `Narrative for user ${userId} and character ${characterId} not found`,
      );
    }

    const updated = narrative.addMessage(message);

    if (updated.isAtLimit(this.MAX_MESSAGES)) {
      // Truncate oldest messages
      const recentMessages = updated.getRecentMessages(Math.floor(this.MAX_MESSAGES * 0.75));
      const truncated = new Narrative({
        userId: updated.userId,
        characterId: updated.characterId,
        sessionId: updated.sessionId,
        context: updated.context,
        messages: recentMessages,
        createdAt: updated.createdAt,
      });
      await this.narrativeRepository.save(truncated);
      return truncated;
    }

    await this.narrativeRepository.save(updated);
    return updated;
  }

  /**
   * Get recent messages
   */
  async getRecentMessages(
    userId: string,
    characterId: string,
    count: number = 10,
  ): Promise<Message[]> {
    const narrative = await this.narrativeRepository.findByUserAndCharacter(userId, characterId);
    if (!narrative) {
      throw new NotFoundException(
        `Narrative for user ${userId} and character ${characterId} not found`,
      );
    }
    return narrative.getRecentMessages(count);
  }

  /**
   * Get all messages for a narrative
   * Returns an empty array if narrative doesn't exist (e.g., new character)
   */
  async getAllMessages(userId: string, characterId: string): Promise<Message[]> {
    const narrative = await this.narrativeRepository.findByUserAndCharacter(userId, characterId);
    if (!narrative) {
      return [];
    }
    return [...narrative.messages];
  }

  /**
   * Clear all messages but keep the narrative
   */
  async clearNarrative(userId: string, characterId: string): Promise<void> {
    const narrative = await this.narrativeRepository.findByUserAndCharacter(userId, characterId);
    if (!narrative) {
      throw new NotFoundException(
        `Narrative for user ${userId} and character ${characterId} not found`,
      );
    }

    const cleared = new Narrative({
      userId: narrative.userId,
      characterId: narrative.characterId,
      sessionId: narrative.sessionId,
      context: narrative.context,
      messages: [],
      createdAt: narrative.createdAt,
    });

    await this.narrativeRepository.save(cleared);
  }

  /**
   * Update narrative context
   */
  async updateContext(
    userId: string,
    characterId: string,
    newContext: Context,
  ): Promise<Narrative> {
    const narrative = await this.narrativeRepository.findByUserAndCharacter(userId, characterId);
    if (!narrative) {
      throw new NotFoundException(
        `Narrative for user ${userId} and character ${characterId} not found`,
      );
    }

    const updated = narrative.updateContext(newContext);
    await this.narrativeRepository.save(updated);
    return updated;
  }

  /**
   * Get instructions of specific type
   */
  async getInstructionsByType(
    userId: string,
    characterId: string,
    type: string,
  ): Promise<ReadonlyArray<import('../../api/dto/response/GameInstructionDto.js').GameInstructionDto>> {
    const narrative = await this.narrativeRepository.findByUserAndCharacter(userId, characterId);
    if (!narrative) {
      throw new NotFoundException(
        `Narrative for user ${userId} and character ${characterId} not found`,
      );
    }
    return narrative.getInstructionsByType(type);
  }

  /**
   * Delete a narrative
   */
  async deleteNarrative(userId: string, characterId: string): Promise<void> {
    await this.narrativeRepository.delete(userId, characterId);
  }
}
