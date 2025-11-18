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

const isAuthenticated = (): boolean => !!getToken();

const logout = (): void => {
  clearToken();
};

// Fetch user profile from backend
const fetchUserProfile = async (token: string): Promise<User | null> => {
  try {
    const response = await fetch('/api/auth/profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
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
  logout,
  fetchUserProfile
};
