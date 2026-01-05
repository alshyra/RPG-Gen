import { Narrative } from '../entities/Narrative.js';

/**
 * Injection token for INarrativeRepository
 */
export const NARRATIVE_REPOSITORY = Symbol('NARRATIVE_REPOSITORY');

/**
 * Repository interface for Narrative
 * 
 * @domain game-narrative
 * Pure TypeScript - no framework dependencies (Port)
 */
export abstract class INarrativeRepository {
  /**
   * Find a narrative by user and character
   */
  abstract findByUserAndCharacter(userId: string, characterId: string): Promise<Narrative | null>;

  /**
   * Find a narrative by session ID
   */
  abstract findBySessionId(sessionId: string): Promise<Narrative | null>;

  /**
   * Save a narrative
   */
  abstract save(narrative: Narrative): Promise<void>;

  /**
   * Delete a narrative
   */
  abstract delete(userId: string, characterId: string): Promise<void>;

  /**
   * Delete by session ID
   */
  abstract deleteBySessionId(sessionId: string): Promise<void>;
}
