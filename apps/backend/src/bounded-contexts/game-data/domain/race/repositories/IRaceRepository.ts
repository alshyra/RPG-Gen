import { Race } from '../entities/Race.js';

/**
 * Injection token for IRaceRepository
 */
export const RACE_REPOSITORY = Symbol('RACE_REPOSITORY');

/**
 * Repository interface for Race
 * 
 * @domain game-data
 * Pure TypeScript - no framework dependencies (Port)
 */
export abstract class IRaceRepository {
  /**
   * Find a race by its ID
   */
  abstract findById(id: string): Promise<Race | null>;

  /**
   * Find all available races
   */
  abstract findAll(): Promise<Race[]>;

  /**
   * Upsert a race definition (for seeding)
   */
  abstract upsert(race: Race): Promise<void>;

  /**
   * Delete a race by ID
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Check if a race exists
   */
  abstract exists(id: string): Promise<boolean>;
}
