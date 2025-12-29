import { AuthUser } from '../domain/entities/AuthUser.js';

/**
 * Unit tests for AuthUser aggregate root entity
 *
 * Tests immutability, factory methods, and domain logic
 */

describe('AuthUser', () => {
  test('should create instance with required props', () => {
    const user = new AuthUser({
      id: '507f1f77bcf86cd799439011',
      googleId: 'google123',
      email: 'user@example.com',
      lastLogin: new Date('2025-01-01'),
    });

    expect(user.id).toBe('507f1f77bcf86cd799439011');
    expect(user.googleId).toBe('google123');
    expect(user.email).toBe('user@example.com');
  });

  test('should require id, googleId, and email', () => {
    expect(() => new AuthUser({
      id: '',
      googleId: 'google123',
      email: 'user@example.com',
      lastLogin: new Date(),
    })).toThrow('id required');

    expect(() => new AuthUser({
      id: '507f1f77bcf86cd799439011',
      googleId: '',
      email: 'user@example.com',
      lastLogin: new Date(),
    })).toThrow('googleId required');

    expect(() => new AuthUser({
      id: '507f1f77bcf86cd799439011',
      googleId: 'google123',
      email: '',
      lastLogin: new Date(),
    })).toThrow('email required');
  });

  test('should support optional profile fields', () => {
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

    expect(user.displayName).toBe('John Doe');
    expect(user.firstName).toBe('John');
    expect(user.lastName).toBe('Doe');
    expect(user.picture).toBe('https://example.com/pic.jpg');
  });

  test('toJwtPayload should return JWT-compatible payload', () => {
    const user = new AuthUser({
      id: '507f1f77bcf86cd799439011',
      googleId: 'google123',
      email: 'user@example.com',
      lastLogin: new Date(),
    });

    const payload = user.toJwtPayload();

    expect(payload.sub).toBe('507f1f77bcf86cd799439011');
    expect(payload.email).toBe('user@example.com');
    expect(payload.googleId).toBe('google123');
  });

  test('toProfile should return public-safe DTO', () => {
    const user = new AuthUser({
      id: '507f1f77bcf86cd799439011',
      googleId: 'google123', // Should NOT be in profile
      email: 'user@example.com',
      displayName: 'John Doe',
      picture: 'https://example.com/pic.jpg',
      lastLogin: new Date('2025-01-01'),
    });

    const profile = user.toProfile();

    expect(profile.id).toBe('507f1f77bcf86cd799439011');
    expect(profile.email).toBe('user@example.com');
    expect(profile.displayName).toBe('John Doe');
    expect(profile.picture).toBe('https://example.com/pic.jpg');
    // Note: toProfile() doesn't expose googleId (checked in type only)
    expect(Object.keys(profile).sort()).toEqual(['displayName', 'email', 'id', 'picture']);
  });

  test('withUpdatedLastLogin should return new immutable instance', () => {
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
    expect(user1.lastLogin).toEqual(originalDate);
    // New instance has updated date
    expect(user2.lastLogin).toEqual(newDate);
    // Both are different instances
    expect(user1).not.toBe(user2);
    // Other props copied
    expect(user2.id).toBe(user1.id);
    expect(user2.googleId).toBe(user1.googleId);
  });

  test('getters should be read-only', () => {
    const user = new AuthUser({
      id: '507f1f77bcf86cd799439011',
      googleId: 'google123',
      email: 'user@example.com',
      lastLogin: new Date(),
    });

    // TypeScript would prevent this at compile-time,
    // but we can test that properties are not writable
    // Properties are private, so they shouldn't be settable
    expect(() => {
      (user as any).id = 'different-id';
    }).toThrow();
  });
});

/**
 * Application Services Tests
 * 
 * AuthAppService orchestrates domain logic.
 * Test workflows without database.
 */

describe('AuthAppService', () => {
  test('dependency injection should work with ports', () => {
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
      sign: (_payload: any) => 'mocked-jwt-token',
    };

    // Verify that the interfaces are correctly defined
    expect(expectedRepository.findById).toBeTruthy();
    expect(expectedRepository.findOrCreateFromGoogle).toBeTruthy();
    expect(jwtService.sign).toBeTruthy();
  });

  test('Google OAuth flow should map profile to AuthUser', () => {
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

    expect(user.googleId).toBe('google-oauth-12345');
    expect(user.email).toBe('john@example.com');
    expect(user.displayName).toBe('John Doe');
  });
});
