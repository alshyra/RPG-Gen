import {
  Injectable, ExecutionContext,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * GoogleAuthGuard also respects the DISABLE_AUTH_FOR_E2E flag so the OAuth
 * dance can be skipped during E2E: when enabled, the guard allows the request
 * through and seeds a synthetic user (if necessary).
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  canActivate(context: ExecutionContext) {
    if (process.env.DISABLE_AUTH_FOR_E2E === 'true') {
      const ctx = context.switchToHttp();
      const req = ctx.getRequest();
      // Google guard must also provide a realistic user shape for the
      // auth callback path which expects fields used by AuthService.login.
      req.user ||= {
        sub: 'e2e-google-user',
        // Use a valid ObjectId-like hex string for _id so DB ops succeed
        _id: '000000000000000000000002',
        email: 'test@example.com',
        displayName: 'Test User',
        picture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
      };
      return true;
    }

    return super.canActivate(context);
  }
}
