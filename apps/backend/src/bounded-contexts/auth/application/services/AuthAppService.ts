import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthUser } from '../../domain/entities/AuthUser.js';
import { IUserRepository } from '../../domain/repositories/IUserRepository.js';

/**
 * AuthAppService
 *
 * Application layer: orchestrates auth workflows.
 * - Handles login flow (Google OAuth)
 * - Profile retrieval
 * - JWT token generation
 * - Delegates persistence to IUserRepository (port)
 *
 * Dependencies injected: repository (abstraction), jwtService (concrete infra)
 */
@Injectable()
export class AuthAppService {
  constructor(
    @Inject(IUserRepository)
    private userRepository: IUserRepository,
    private jwtService: JwtService,
  ) {}

  /**
   * Login flow: find or create user from Google profile, issue JWT
   */
  async loginWithGoogle(googleProfile: {
    googleId: string;
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
  }): Promise<{ accessToken: string; user: AuthUser }> {
    // Repository handles find-or-create logic
    const user = await this.userRepository.findOrCreateFromGoogle(googleProfile);

    // Generate JWT from domain entity
    const accessToken = this.jwtService.sign(user.toJwtPayload(), {
      secret: process.env.JWT_SECRET || 'dev-secret',
      expiresIn: '24h',
    });

    return { accessToken, user };
  }

  /**
   * Validate user by JWT payload
   * Ensures user still exists in DB (may have been deleted since token issued)
   */
  async validateUserByToken(payload: {
    sub: string;
    email: string;
    googleId: string;
  }): Promise<AuthUser | null> {
    return this.userRepository.findById(payload.sub);
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<AuthUser | null> {
    return this.userRepository.findById(userId);
  }

  /**
   * Logout (currently no-op; JWT handled client-side)
   * Can be extended for token blacklisting, session management, etc.
   */
  async logout(_userId: string): Promise<void> {
    // TODO: implement token blacklist if needed
  }
}
