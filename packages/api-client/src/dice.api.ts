import type { DiceRequestDto, DiceResultDto } from "@rpg-gen/shared";
import { apiClient, getData } from "./index.js";

export const diceApi = {
  /**
   * Roll dice
   */
  async roll(request: DiceRequestDto): Promise<DiceResultDto> {
    const response = await apiClient.POST("/api/dice", {
      body: request,
    });
    return getData(response);
  },
};
