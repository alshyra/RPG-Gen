import type { ImageRequestDto, CharacterIdBodyDto, AvatarResponseDto } from "@rpg-gen/shared";
import { apiClient, getData } from "./index.js";

export const imageApi = {
  /**
   * Generate image from prompt
   */
  async generate(request: ImageRequestDto): Promise<void> {
    const response = await apiClient.POST("/api/image", {
      body: request,
    });
    return getData(response);
  },

  /**
   * Generate character avatar
   */
  async generateAvatar(body: CharacterIdBodyDto): Promise<AvatarResponseDto> {
    const response = await apiClient.POST("/api/image/generate-avatar", {
      body,
    });
    return getData(response);
  },
};
