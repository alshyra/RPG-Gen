import { CharacterClass } from '../entities/CharacterClass.js';

/**
 * Injection token for IClassRepository
 */
export const CLASS_REPOSITORY = Symbol('CLASS_REPOSITORY');

/**
 * Repository interface for CharacterClass
 * 
 * @domain game-data
 * Pure TypeScript - no framework dependencies (Port)
 */
export abstract class IClassRepository {
  /**
   * Find a class by its name (e.g., 'guerrier', 'mage', 'rogue')
   */
  abstract findByName(name: string): Promise<CharacterClass | null>;

  /**
   * Find all available classes
   */
  abstract findAll(): Promise<CharacterClass[]>;

  /**
   * Upsert a class definition (for seeding)
   */
  abstract upsert(characterClass: CharacterClass): Promise<void>;

  /**
   * Delete a class by name
   */
  abstract delete(name: string): Promise<void>;

  /**
   * Check if a class exists
   */
  abstract exists(name: string): Promise<boolean>;
}
