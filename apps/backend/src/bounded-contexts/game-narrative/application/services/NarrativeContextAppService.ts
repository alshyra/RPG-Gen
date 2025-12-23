import { Injectable, Inject, Logger } from '@nestjs/common';
import { NarrativeContext, CharacterContextData } from '../../domain/narrative/entities/NarrativeContext.js';
import { INarrativeContextRepository, NARRATIVE_CONTEXT_REPOSITORY } from '../../domain/narrative/repositories/INarrativeContextRepository.js';

/**
 * Application service for NarrativeContext
 * Manages narrative generation context and character information
 * 
 * @application game-narrative
 */
@Injectable()
export class NarrativeContextAppService {
  private readonly logger = new Logger(NarrativeContextAppService.name);

  constructor(@Inject(NARRATIVE_CONTEXT_REPOSITORY) private readonly contextRepository: INarrativeContextRepository) {}

  /**
   * Create or get a narrative context for a session
   */
  async getOrCreateContext(
    sessionId: string,
    characterContext: CharacterContextData,
    systemPrompt: string,
    scenarioPrompt: string,
  ): Promise<NarrativeContext> {
    let context = await this.contextRepository.findBySessionId(sessionId);

    if (!context) {
      context = new NarrativeContext({
        sessionId,
        characterContext,
        systemPrompt,
        scenarioPrompt,
      });
      await this.contextRepository.save(context);
    }

    return context;
  }

  /**
   * Update character context
   */
  async updateCharacterContext(
    sessionId: string,
    newContext: Partial<CharacterContextData>,
  ): Promise<NarrativeContext> {
    const context = await this.contextRepository.findBySessionId(sessionId);

    if (!context) {
      throw new Error(`Narrative context not found for session ${sessionId}`);
    }

    const updated = context.updateCharacterContext(newContext);
    await this.contextRepository.save(updated);

    return updated;
  }

  /**
   * Get full context for narrative generation
   */
  async getFullContext(sessionId: string): Promise<string> {
    const context = await this.contextRepository.findBySessionId(sessionId);

    if (!context) {
      throw new Error(`Narrative context not found for session ${sessionId}`);
    }

    return context.getFullContext();
  }

  /**
   * Get character summary
   */
  async getCharacterSummary(sessionId: string): Promise<string> {
    const context = await this.contextRepository.findBySessionId(sessionId);

    if (!context) {
      throw new Error(`Narrative context not found for session ${sessionId}`);
    }

    return context.buildCharacterSummary();
  }

  /**
   * Delete context
   */
  async deleteContext(sessionId: string): Promise<void> {
    await this.contextRepository.delete(sessionId);
  }
}
