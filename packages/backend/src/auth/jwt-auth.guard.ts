import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard supports a testing bypass: when the environment variable
 * DISABLE_AUTH_FOR_E2E is set to 'true', the guard will skip auth checks and
 * inject a lightweight test user on the request. This makes it possible to
 * run full e2e tests against a live backend without mocking external APIs.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // If the e2e bypass flag is enabled, accept all requests and create a
    // synthetic user on the request so downstream handlers that rely on
    // request.user keep working during tests.
    const skip = process.env.DISABLE_AUTH_FOR_E2E === 'true';
    if (skip) {
      const ctx = context.switchToHttp();
      const req = ctx.getRequest();

      req.user ||= {
        // `sub` kept for unit-test assertions
        sub: 'e2e-test-user',
        // Provide a valid 24-char hex string to satisfy Mongoose ObjectId
        _id: '000000000000000000000001',
        email: 'test@example.com',
        displayName: 'Test User',
        // Small inline image so frontend renders an <img> element for tests
        picture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
      };

      return true;
    }

    return super.canActivate(context);
  }
}
