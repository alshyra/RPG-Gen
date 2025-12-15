import type { AuthProfileDto } from "@rpg-gen/shared";
import { apiClient, getData } from "./client.js";

const AUTH_BASE_URL = "/api/auth";

export const authApi = {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<AuthProfileDto> {
    const response = await apiClient.GET("/api/auth/profile");
    return getData(response);
  },

  /**
   * Initiate Google OAuth login
   * Note: This redirects to Google, use window.location.href
   */
  getGoogleAuthUrl(): string {
    return `${AUTH_BASE_URL}/google`;
  },

  /**
   * Logout
   * Note: Client should clear token after this
   */
  async logout(): Promise<void> {
    await apiClient.GET("/api/auth/logout");
  },
};
