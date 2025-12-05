import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';
import { authService } from './authApi';

describe('authService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Creates a mock JWT token with the given expiration time in seconds since epoch.
   */
  const createMockToken = (exp: number): string => {
    const header = btoa(JSON.stringify({
      alg: 'HS256',
      typ: 'JWT',
    }));
    const payload = btoa(JSON.stringify({
      sub: 'user123',
      email: 'test@example.com',
      exp,
    }));
    const signature = 'mock_signature';
    return `${header}.${payload}.${signature}`;
  };

  describe('isTokenExpired', () => {
    it('should return true for an invalid token', () => {
      expect(authService.isTokenExpired('invalid-token'))
        .toBe(true);
    });

    it('should return true for an expired token', () => {
      const now = Date.now();
      vi.setSystemTime(now);
      // Token expired 1 hour ago
      const expiredToken = createMockToken(Math.floor(now / 1000) - 3600);
      expect(authService.isTokenExpired(expiredToken))
        .toBe(true);
    });

    it('should return false for a valid non-expired token', () => {
      const now = Date.now();
      vi.setSystemTime(now);
      // Token expires in 1 hour
      const validToken = createMockToken(Math.floor(now / 1000) + 3600);
      expect(authService.isTokenExpired(validToken))
        .toBe(false);
    });

    it('should return true for a token that expires exactly now', () => {
      const now = Date.now();
      vi.setSystemTime(now);
      // Token expires exactly now
      const expiringToken = createMockToken(Math.floor(now / 1000));
      expect(authService.isTokenExpired(expiringToken))
        .toBe(true);
    });

    it('should return true for a token without exp claim', () => {
      const header = btoa(JSON.stringify({
        alg: 'HS256',
        typ: 'JWT',
      }));
      const payload = btoa(JSON.stringify({
        sub: 'user123',
        email: 'test@example.com',
      }));
      const noExpToken = `${header}.${payload}.signature`;
      expect(authService.isTokenExpired(noExpToken))
        .toBe(true);
    });

    it('should return true for an empty string', () => {
      expect(authService.isTokenExpired(''))
        .toBe(true);
    });

    it('should return true for a malformed token with wrong number of parts', () => {
      expect(authService.isTokenExpired('part1.part2'))
        .toBe(true);
      expect(authService.isTokenExpired('part1.part2.part3.part4'))
        .toBe(true);
    });
  });
});
