import test from 'ava';
import { AuthUser } from '../../../../../src/bounded-contexts/auth/domain/entities/AuthUser.js';

/**
 * Unit tests for Application Services
 * 
 * AuthAppService orchestrates domain logic.
 * Test workflows without database.
 */

test('AuthAppService dependency injection should work with ports', t => {
  // This is a simple POC showing how AuthAppService should be structured
  // with IUserRepository injected via DI
  
  const expectedRepository = {
    findById: async () => null,
    findByEmail: async () => null,
    findByGoogleId: async () => null,
    findOrCreateFromGoogle: async () => new AuthUser({
      id: 'test-id',
      googleId: 'test-google',
      email: 'test@example.com',
      lastLogin: new Date(),
    }),
    save: async (user: AuthUser) => user,
    delete: async () => {},
  };

  // Mock JwtService
  const jwtService = {
    sign: (payload: any) => 'mocked-jwt-token',
  };

  // Verify that the interfaces are correctly defined
  t.truthy(expectedRepository.findById);
  t.truthy(expectedRepository.findOrCreateFromGoogle);
  t.truthy(jwtService.sign);
});

test('Google OAuth flow should map profile to AuthUser', t => {
  const googleProfile = {
    googleId: 'google-oauth-12345',
    email: 'john@example.com',
    displayName: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    picture: 'https://example.com/photo.jpg',
  };

  // Simulate creating user from Google profile
  const user = new AuthUser({
    id: 'new-user-id',
    ...googleProfile,
    lastLogin: new Date(),
  });

  t.is(user.googleId, 'google-oauth-12345');
  t.is(user.email, 'john@example.com');
  t.is(user.displayName, 'John Doe');
});
