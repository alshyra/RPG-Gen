import { Conversation } from '../entities/Conversation.js';

/**
 * Injection token for IConversationRepository
 */
export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');

/**
 * Repository interface for Conversation
 * 
 * @domain game-narrative
 * Pure TypeScript - no framework dependencies (Port)
 */
export abstract class IConversationRepository {
  /**
   * Find a conversation by user and character
   */
  abstract findByUserAndCharacter(userId: string, characterId: string): Promise<Conversation | null>;

  /**
   * Save a conversation
   */
  abstract save(conversation: Conversation): Promise<void>;

  /**
   * Delete a conversation
   */
  abstract delete(userId: string, characterId: string): Promise<void>;

  /**
   * Check if a conversation exists
   */
  abstract exists(userId: string, characterId: string): Promise<boolean>;

  /**
   * Find all conversations for a user
   */
  abstract findByUser(userId: string): Promise<Conversation[]>;

  /**
   * Find all conversations for a character
   */
  abstract findByCharacter(characterId: string): Promise<Conversation[]>;
}
