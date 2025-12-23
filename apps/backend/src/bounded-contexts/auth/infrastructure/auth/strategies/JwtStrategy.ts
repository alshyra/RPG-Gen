import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import type { AuthUser } from "../../../domain/entities/AuthUser.js";
import { IUserRepository } from "../../../domain/repositories/IUserRepository.js";

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  googleId: string;
}

/**
 * JwtStrategy
 *
 * Validates JWT tokens and validates user still exists.
 * Returns domain AuthUser entity.
 * Delegates user lookups to IUserRepository (port).
 * 
 * @infrastructure
 * Couples to Passport.js library and JWT validation
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(IUserRepository)
    private userRepository: IUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "default-secret-change-in-production",
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return user;
  }
}
