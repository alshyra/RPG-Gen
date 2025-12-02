import test from 'ava';
import { JwtAuthGuard } from '../src/domain/auth/jwt-auth.guard.js';
import { GoogleAuthGuard } from '../src/domain/auth/google-auth.guard.js';

// Minimal fake ExecutionContext to exercise guard logic.
function fakeContext() {
  const req: Record<string, any> = {};
  return { switchToHttp: () => ({ getRequest: () => req }) } as unknown as any;
}

test('JwtAuthGuard bypasses auth and injects user when DISABLE_AUTH_FOR_E2E=true', (t) => {
  process.env.DISABLE_AUTH_FOR_E2E = 'true';
  const guard = new JwtAuthGuard();
  const ctx = fakeContext();

  const ok = guard.canActivate(ctx);
  t.true(ok === true);
  const req = (ctx).switchToHttp()
    .getRequest();
  t.truthy(req.user);
  t.is(req.user.sub, 'e2e-test-user');
});

test('GoogleAuthGuard bypasses auth and injects user when DISABLE_AUTH_FOR_E2E=true', (t) => {
  process.env.DISABLE_AUTH_FOR_E2E = 'true';
  const guard = new GoogleAuthGuard();
  const ctx = fakeContext();

  const ok = guard.canActivate(ctx);
  t.true(ok === true);
  const req = (ctx).switchToHttp()
    .getRequest();
  t.truthy(req.user);
  t.is(req.user.sub, 'e2e-google-user');
});
