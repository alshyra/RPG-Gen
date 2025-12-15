import type { UseItemRequestDto, UseItemResponseDto } from '@rpg-gen/shared';
import { apiClient, getData } from './index.js';

export const inventoryApi = {
  /**
   * Use an item from inventory
   */
  async useItem(characterId: string, request: UseItemRequestDto): Promise<UseItemResponseDto> {
    const response = await apiClient.POST('/api/characters/{characterId}/inventory/use', {
      params: { path: { characterId } },
      body: request,
    });
    return getData(response);
  },
};
