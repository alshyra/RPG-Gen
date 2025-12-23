import { Aptitude } from '../entities/Aptitude.js';

/**
 * Injection token for IAptitudeRepository
 */
export const APTITUDE_REPOSITORY = Symbol('APTITUDE_REPOSITORY');

/**
 * Repository interface for Aptitude
 * 
 * @domain game-data
 * Pure TypeScript - no framework dependencies (Port)
 */
export abstract class IAptitudeRepository {
  /**
   * Find an aptitude by its ID
   */
  abstract findById(id: string): Promise<Aptitude | null>;

  /**
   * Find multiple aptitudes by IDs
   */
  abstract findByIds(ids: string[]): Promise<Aptitude[]>;

  /**
   * Find all aptitudes
   */
  abstract findAll(): Promise<Aptitude[]>;

  /**
   * Find aptitudes by effect type
   */
  abstract findByEffectType(effectType: string): Promise<Aptitude[]>;

  /**
   * Upsert an aptitude definition (for seeding)
   */
  abstract upsert(aptitude: Aptitude): Promise<void>;

  /**
   * Bulk upsert aptitudes (for seeding)
   */
  abstract bulkUpsert(aptitudes: Aptitude[]): Promise<void>;

  /**
   * Delete an aptitude by ID
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Check if an aptitude exists
   */
  abstract exists(id: string): Promise<boolean>;
}
