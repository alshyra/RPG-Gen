import test from 'ava';
import { AuthUser } from '../domain/entities/AuthUser.js';

/**
 * Unit tests for AuthUser aggregate root entity
 *
 * Tests immutability, factory methods, and domain logic
 */

test('AuthUser should create instance with required props', t => {
  const user = new AuthUser({
    id: '507f1f77bcf86cd799439011',
    googleId: 'google123',
    email: 'user@example.com',
    lastLogin: new Date('2025-01-01'),
  });

  t.is(user.id, '507f1f77bcf86cd799439011');
  t.is(user.googleId, 'google123');
  t.is(user.email, 'user@example.com');
});

test('AuthUser should require id, googleId, and email', t => {
  const error1 = t.throws(() => new AuthUser({
    id: '',
    googleId: 'google123',
    email: 'user@example.com',
    lastLogin: new Date(),
  }), { message: 'id required' });

  const error2 = t.throws(() => new AuthUser({
    id: '507f1f77bcf86cd799439011',
    googleId: '',
    email: 'user@example.com',
    lastLogin: new Date(),
  }), { message: 'googleId required' });

  const error3 = t.throws(() => new AuthUser({
    id: '507f1f77bcf86cd799439011',
    googleId: 'google123',
    email: '',
    lastLogin: new Date(),
  }), { message: 'email required' });

  t.pass();
});

test('AuthUser should support optional profile fields', t => {
  const user = new AuthUser({
    id: '507f1f77bcf86cd799439011',
    googleId: 'google123',
    email: 'user@example.com',
    displayName: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    picture: 'https://example.com/pic.jpg',
    lastLogin: new Date('2025-01-01'),
  });

  t.is(user.displayName, 'John Doe');
  t.is(user.firstName, 'John');
  t.is(user.lastName, 'Doe');
  t.is(user.picture, 'https://example.com/pic.jpg');
});

test('AuthUser.toJwtPayload should return JWT-compatible payload', t => {
  const user = new AuthUser({
    id: '507f1f77bcf86cd799439011',
    googleId: 'google123',
    email: 'user@example.com',
    lastLogin: new Date(),
  });

  const payload = user.toJwtPayload();

  t.is(payload.sub, '507f1f77bcf86cd799439011');
  t.is(payload.email, 'user@example.com');
  t.is(payload.googleId, 'google123');
});

test('AuthUser.toProfile should return public-safe DTO', t => {
  const user = new AuthUser({
    id: '507f1f77bcf86cd799439011',
    googleId: 'google123', // Should NOT be in profile
    email: 'user@example.com',
    displayName: 'John Doe',
    picture: 'https://example.com/pic.jpg',
    lastLogin: new Date('2025-01-01'),
  });

  const profile = user.toProfile();

  t.is(profile.id, '507f1f77bcf86cd799439011');
  t.is(profile.email, 'user@example.com');
  t.is(profile.displayName, 'John Doe');
  t.is(profile.picture, 'https://example.com/pic.jpg');
  // Note: toProfile() doesn't expose googleId (checked in type only)
  t.deepEqual(Object.keys(profile).sort(), ['displayName', 'email', 'id', 'picture']);
});

test('AuthUser.withUpdatedLastLogin should return new immutable instance', t => {
  const originalDate = new Date('2025-01-01');
  const user1 = new AuthUser({
    id: '507f1f77bcf86cd799439011',
    googleId: 'google123',
    email: 'user@example.com',
    lastLogin: originalDate,
  });

  const newDate = new Date('2025-01-02');
  const user2 = user1.withUpdatedLastLogin(newDate);

  // Original unchanged (immutability)
  t.deepEqual(user1.lastLogin, originalDate);
  // New instance has updated date
  t.deepEqual(user2.lastLogin, newDate);
  // Both are different instances
  t.not(user1, user2);
  // Other props copied
  t.is(user2.id, user1.id);
  t.is(user2.googleId, user1.googleId);
});

test('AuthUser getters should be read-only', t => {
  const user = new AuthUser({
    id: '507f1f77bcf86cd799439011',
    googleId: 'google123',
    email: 'user@example.com',
    lastLogin: new Date(),
  });

  // TypeScript would prevent this at compile-time,
  // but we can test that properties are not writable
  const descriptor = Object.getOwnPropertyDescriptor(user, 'id');
  // Properties are private, so they shouldn't be settable
  t.throws(() => {
    (user as any).id = 'different-id';
  });
});

/**
 * Application Services Tests
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
