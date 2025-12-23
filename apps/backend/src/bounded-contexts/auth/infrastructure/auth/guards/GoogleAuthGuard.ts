import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { getConfig } from "../../../../../config.js";

/**
 * GoogleAuthGuard
 * 
 * Guard to protect routes with Google OAuth authentication.
 * Also respects the DISABLE_AUTH_FOR_E2E flag so the OAuth
 * dance can be skipped during E2E testing.
 * 
 * @infrastructure
 * NestJS-specific guard using Passport.js
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard("google") {
  canActivate(context: ExecutionContext) {
    if (getConfig().features.e2eMode) {
      const ctx = context.switchToHttp();
      const req = ctx.getRequest();
      // Google guard must also provide a realistic user shape for the
      // auth callback path which expects fields used by AuthService.login.
      req.user ||= {
        sub: "e2e-google-user",
        // Use a valid ObjectId-like hex string for _id so DB ops succeed
        _id: "000000000000000000000002",
        email: "test@example.com",
        displayName: "Test User",
        picture:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
      };
      return true;
    }

    return super.canActivate(context);
  }
}
