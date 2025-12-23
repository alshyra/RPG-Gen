import { EnemyDefinition } from '../entities/EnemyDefinition.js';

/**
 * Injection token for IEnemyRepository
 */
export const ENEMY_REPOSITORY = Symbol('ENEMY_REPOSITORY');

/**
 * Repository interface for EnemyDefinition
 * 
 * @domain game-data
 * Pure TypeScript - no framework dependencies (Port)
 */
export abstract class IEnemyRepository {
  /**
   * Find an enemy by its ID
   */
  abstract findById(id: string): Promise<EnemyDefinition | null>;

  /**
   * Find an enemy by name
   */
  abstract findByName(name: string): Promise<EnemyDefinition | null>;

  /**
   * Find multiple enemies by IDs
   */
  abstract findByIds(ids: string[]): Promise<EnemyDefinition[]>;

  /**
   * Find all enemies
   */
  abstract findAll(): Promise<EnemyDefinition[]>;

  /**
   * Find enemies by level range
   */
  abstract findByLevelRange(minLevel: number, maxLevel: number): Promise<EnemyDefinition[]>;

  /**
   * Upsert an enemy definition (for seeding)
   */
  abstract upsert(enemy: EnemyDefinition): Promise<void>;

  /**
   * Bulk upsert enemies (for seeding)
   */
  abstract bulkUpsert(enemies: EnemyDefinition[]): Promise<void>;

  /**
   * Delete an enemy by ID
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Check if an enemy exists
   */
  abstract exists(id: string): Promise<boolean>;
}
