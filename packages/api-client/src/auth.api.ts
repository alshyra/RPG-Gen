import type { AuthProfileDto } from "@rpg-gen/shared";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed } from "vue";
import { apiClient, getData } from "./client.js";

const AUTH_BASE_URL = "/api/auth";

export const authApi = {
  async getProfile(): Promise<AuthProfileDto> {
    const response = await apiClient.GET("/api/auth/profile");
    return getData(response);
  },
  getGoogleAuthUrl(): string {
    return `${AUTH_BASE_URL}/google`;
  },
  async logout(): Promise<void> {
    await apiClient.GET("/api/auth/logout");
  },
};

const authKeys = {
  profile: () => ["auth", "profile"] as const,
};

export function useAuth(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const profile = useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => authApi.getProfile(),
    enabled: options?.enabled !== false,
  });

  const logout = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });

  const isAuthenticated = computed(() => !!profile.data.value);
  const isLoading = computed(() => profile.isLoading.value);

  return {
    profile,
    logout,
    getGoogleAuthUrl: authApi.getGoogleAuthUrl,
    isAuthenticated,
    isLoading,
  };
}
