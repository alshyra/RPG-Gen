import { NarrativeContext } from '../entities/NarrativeContext.js';

/**
 * Injection token for INarrativeContextRepository
 */
export const NARRATIVE_CONTEXT_REPOSITORY = Symbol('NARRATIVE_CONTEXT_REPOSITORY');

/**
 * Repository interface for NarrativeContext
 * 
 * @domain game-narrative
 * Pure TypeScript - no framework dependencies (Port)
 */
export abstract class INarrativeContextRepository {
  /**
   * Find narrative context by session ID
   */
  abstract findBySessionId(sessionId: string): Promise<NarrativeContext | null>;

  /**
   * Save a narrative context
   */
  abstract save(context: NarrativeContext): Promise<void>;

  /**
   * Delete a narrative context
   */
  abstract delete(sessionId: string): Promise<void>;

  /**
   * Check if context exists
   */
  abstract exists(sessionId: string): Promise<boolean>;
}
