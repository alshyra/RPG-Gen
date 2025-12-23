import type { AuthUser } from '../entities/AuthUser.js';

/**
 * Port: IUserRepository
 *
 * Defines the contract for user persistence operations.
 * Adapters (MongoUserRepository) implement this interface.
 */
export interface IUserRepository {
  /**
   * Find user by MongoDB ID
   * @returns AuthUser or null if not found
   */
  findById(id: string): Promise<AuthUser | null>;

  /**
   * Find user by email
   * @returns AuthUser or null if not found
   */
  findByEmail(email: string): Promise<AuthUser | null>;

  /**
   * Find user by Google ID
   * @returns AuthUser or null if not found
   */
  findByGoogleId(googleId: string): Promise<AuthUser | null>;

  /**
   * Find user by Google ID or create if not exists
   * Called during OAuth callback flow
   */
  findOrCreateFromGoogle(googleProfile: {
    googleId: string;
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
  }): Promise<AuthUser>;

  /**
   * Save or update user
   */
  save(user: AuthUser): Promise<AuthUser>;

  /**
   * Delete user by ID
   */
  delete(id: string): Promise<void>;
}

// Token for DI
export const IUserRepository = Symbol('IUserRepository');
