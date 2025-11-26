/**
 * AuthService - Manages authentication state and tokens
 */

const TOKEN_KEY = 'rpg-auth-token';
const USER_KEY = 'rpg-user-data';

export interface User {
  id: string;
  email: string;
  displayName: string;
  picture?: string;
}

const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const setToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error('Failed to save auth token', e);
  }
};

const clearToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    console.error('Failed to clear auth token', e);
  }
};

const getUser = (): User | null => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

const setUser = (user: User): void => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user data', e);
  }
};

/**
 * Decodes a JWT token and returns its payload.
 * Returns null if the token is invalid or cannot be decoded.
 */
const decodeToken = (token: string): { exp?: number } | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

/**
 * Checks if the JWT token is expired.
 * Returns true if expired or invalid, false if still valid.
 */
const isTokenExpired = (token: string): boolean => {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000;
  return Date.now() >= expirationTime;
};

/**
 * Checks if the user is authenticated with a valid (non-expired) token.
 */
const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;
  return !isTokenExpired(token);
};

const logout = (): void => {
  clearToken();
};

// Fetch user profile from backend
const fetchUserProfile = async (token: string): Promise<User | null> => {
  try {
    const response = await fetch('/api/auth/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.ok) {
      const userData = await response.json();
      setUser(userData);
      return userData;
    }
    return null;
  } catch (e) {
    console.error('Failed to fetch user profile', e);
    return null;
  }
};

export const authService = {
  getToken,
  setToken,
  clearToken,
  getUser,
  setUser,
  isAuthenticated,
  isTokenExpired,
  logout,
  fetchUserProfile,
};
