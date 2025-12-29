import type { AvatarResponseDto } from "@rpg-gen/shared";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { apiClient, getData } from "./index.js";

// Internal API functions (private - use useImage() hook)
const imageApi = {
  async generateAvatar(characterId: string): Promise<AvatarResponseDto> {
    const response = await apiClient.POST("/api/character/avatar/generate", {
      body: { characterId },
    });
    return getData(response);
  },
};

export function useImage() {
  // queryClient reserved for future optimistic updates
  void useQueryClient();

  return {
    generateAvatar: useMutation({
      mutationFn: async (characterId: string) => imageApi.generateAvatar(characterId),
    }),
  };
}
