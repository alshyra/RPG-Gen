import type { ImageRequestDto, CharacterIdBodyDto, AvatarResponseDto } from "@rpg-gen/shared";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { apiClient, getData } from "./index.js";

// Exported temporarily for legacy code - prefer using useImage()
// Internal API functions (private - use useImage() hook)
const imageApi = {
  async generate(request: ImageRequestDto): Promise<void> {
    const response = await apiClient.POST("/api/image", {
      body: request,
    });
    return getData(response);
  },
  async generateAvatar(body: CharacterIdBodyDto): Promise<AvatarResponseDto> {
    const response = await apiClient.POST("/api/image/generate-avatar", {
      body,
    });
    return getData(response);
  },
};

export function useImage() {
  const queryClient = useQueryClient();

  return {
    generate: useMutation({
      mutationFn: async (data: ImageRequestDto) => imageApi.generate(data),
    }),
    generateAvatar: useMutation({
      mutationFn: async (data: CharacterIdBodyDto) => imageApi.generateAvatar(data),
    }),
  };
}
