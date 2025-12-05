import { api } from './apiClient';

class InventoryApi {
  async useItem(characterId: string, itemId: string) {
    const { data } = await api.POST('/api/characters/{characterId}/inventory/use', {
      params: { path: { characterId } },
      body: { itemId },
    });
    if (!data) throw new Error('Failed to use item');
    return data;
  }
}

export const inventoryApi = new InventoryApi();
