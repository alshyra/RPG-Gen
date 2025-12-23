import { Inject, Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback, Profile } from "passport-google-oauth20";
import { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import { getConfig } from "../../../../../config.js";

/**
 * GoogleStrategy
 *
 * Passport strategy for Google OAuth2.
 * Delegates persistence to IUserRepository (port).
 * Returns domain AuthUser entity to controller.
 * 
 * @infrastructure
 * Couples to Passport.js library and Google OAuth APIs
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    @Inject(IUserRepository)
    private userRepository: IUserRepository,
  ) {
    super({
      clientID: getConfig().google.oauth.clientId,
      clientSecret: getConfig().google.oauth.clientSecret,
      callbackURL: getConfig().google.oauth.callbackUrl,
      scope: ["email", "profile"],
    });

    this.logger.log("GoogleStrategy initialized with:", {
      clientID: process.env.GOOGLE_OAUTH_CLIENT_ID?.substring(0, 10) + "***",
      callbackURL: process.env.GOOGLE_OAUTH_CALLBACK_URL,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    this.logger.log("Google profile received:", {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      displayName: profile.displayName,
    });

    // Use repository to find or create user
    const user = await this.userRepository.findOrCreateFromGoogle({
      googleId: profile.id,
      email: profile.emails?.[0]?.value || "",
      displayName: profile.displayName,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      picture: profile.photos?.[0]?.value,
    });

    this.logger.log("User validated/created:", {
      id: user.id,
      email: user.email,
    });

    done(null, user);
  }
}
