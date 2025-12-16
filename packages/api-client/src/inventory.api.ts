import type { UseItemRequestDto, UseItemResponseDto } from "@rpg-gen/shared";
import type { MaybeRefOrGetter } from "vue";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, toValue } from "vue";
import { apiClient, getData } from "./index.js";

// Exported temporarily for legacy code - prefer using useInventory()
// Internal API functions (private - use useInventory() hook)
const inventoryApi = {
  async useItem(characterId: string, request: UseItemRequestDto): Promise<UseItemResponseDto> {
    const response = await apiClient.POST("/api/characters/{characterId}/inventory/use", {
      params: { path: { characterId } },
      body: request,
    });
    return getData(response);
  },
};

export function useInventory(
  characterId: MaybeRefOrGetter<string | undefined>,
  _options?: { enabled?: boolean },
) {
  const queryClient = useQueryClient();
  const id = computed(() => toValue(characterId));

  return {
    useItem: useMutation({
      mutationFn: async (data: UseItemRequestDto) => {
        const charId = id.value;
        if (!charId) throw new Error("Character ID is required");
        return inventoryApi.useItem(charId, data);
      },
      onSuccess: () => {
        if (id.value) {
          queryClient.invalidateQueries({ queryKey: ["character", id.value] });
        }
      },
    }),
  };
}
