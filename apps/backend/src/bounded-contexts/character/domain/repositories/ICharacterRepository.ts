import { CharacterEntity } from "../entities/CharacterEntity.js";

/**
 * Repository interface for Character domain entity.
 * Defines the contract for persistence operations.
 */
export interface ICharacterRepository {
  /**
   * Find a character by its unique ID.
   */
  findById(characterId: string): Promise<CharacterEntity | null>;

  /**
   * Find a character by userId and characterId.
   */
  findByUserAndId(userId: string, characterId: string): Promise<CharacterEntity | null>;

  /**
   * Find all characters for a user.
   */
  findByUserId(userId: string, includeDeceased?: boolean): Promise<CharacterEntity[]>;

  /**
   * Find all draft characters for a user.
   */
  findDraftsByUserId(userId: string): Promise<CharacterEntity[]>;

  /**
   * Find all completed characters for a user.
   */
  findCompletedByUserId(userId: string): Promise<CharacterEntity[]>;

  /**
   * Find all deceased characters for a user.
   */
  findDeceasedByUserId(userId: string): Promise<CharacterEntity[]>;

  /**
   * Save a character (create or update).
   */
  save(character: CharacterEntity): Promise<void>;

  /**
   * Delete a character by ID.
   */
  delete(characterId: string): Promise<void>;

  /**
   * Delete a character by userId and characterId.
   */
  deleteByUserAndId(userId: string, characterId: string): Promise<boolean>;

  /**
   * Check if a character exists.
   */
  exists(characterId: string): Promise<boolean>;
}

/**
 * Symbol for dependency injection.
 */
export const ICharacterRepository = Symbol("ICharacterRepository");
