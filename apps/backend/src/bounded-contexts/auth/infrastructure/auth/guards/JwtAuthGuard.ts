import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { getConfig } from "../../../../../config.js";
import { AuthUser } from "../../../domain/entities/AuthUser.js";

/**
 * JwtAuthGuard
 * 
 * Guard to protect routes with JWT authentication.
 * Supports a testing bypass: when E2E mode is enabled, the guard will skip
 * auth checks and inject a lightweight test user on the request.
 * 
 * @infrastructure
 * NestJS-specific guard using Passport.js
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    // If the e2e bypass flag is enabled, accept all requests and create a
    // synthetic user on the request so downstream handlers that rely on
    // request.user keep working during tests.
    const skip = getConfig().features.e2eMode;
    if (skip) {
      const ctx = context.switchToHttp();
      const req = ctx.getRequest();

      // Create a proper AuthUser instance so toProfile() and other methods work
      req.user ||= new AuthUser({
        // Provide a valid 24-char hex string to satisfy Mongoose ObjectId
        id: "000000000000000000000001",
        googleId: "e2e-test-google-id",
        email: "test@example.com",
        displayName: "Test User",
        firstName: "Test",
        lastName: "User",
        // Small inline image so frontend renders an <img> element for tests
        picture:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
        lastLogin: new Date(),
      });

      return true;
    }

    return super.canActivate(context);
  }
}
