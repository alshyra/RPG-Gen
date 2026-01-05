import type { DiceRequestDto, DiceResultDto } from "@rpg-gen/shared";
import { useMutation } from "@tanstack/vue-query";
import { apiClient, getData } from "./index.js";

// Internal API function
export const diceApi = {
  async roll(request: DiceRequestDto): Promise<DiceResultDto> {
    const response = await apiClient.POST("/api/dice", {
      body: request,
    });
    return getData(response);
  },
};

/**
 * Vue Query wrapper for dice rolling
 */
export function useDice() {
  // Mutation: Roll dice
  const roll = useMutation({
    mutationFn: async (data: DiceRequestDto) => diceApi.roll(data),
  });

  return {
    roll,
  };
}
