/**
 * Character Service using OpenAPI-fetch client
 * Type-safe API calls for character management
 */
import type { CharacterDto, CreateInventoryItemDto, ItemDto, UpdateCharacterRequestDto } from '@rpg-gen/shared';
import { api } from './apiClient';

// Helper to extract data from openapi-fetch response
const getData = <T>(response: { data?: T; error?: unknown }): T => {
  if (response.error) {
    throw response.error;
  }
  return response.data as T;
};

// Convert ItemDto to OpenAPI CreateInventoryItemDto format
const toOpenApiInventoryItem = (item: Partial<ItemDto>): CreateInventoryItemDto => ({
  definitionId: item.definitionId ?? '',
  _id: item._id,
  name: item.name,
  qty: item.qty,
  description: item.description,
  equipped: item.equipped,
  meta: item.meta as Record<string, never> | undefined,
});

export const characterApi = {
  /**
   * Create a new character
   */
  createCharacter: async (world: string) => {
    // Use fetch directly since the endpoint body type is not properly typed in OpenAPI
    const response = await api.POST('/api/characters', {
      body: { world },
    });
    if (response.error) throw new Error('Failed to create character');
    return response.data;
  },

  /**
   * Get all characters for the current user
   */
  getAllCharacters: async () => {
    const response = await api.GET('/api/characters');
    return getData(response);
  },

  /**
   * Get a specific character by ID
   */
  getCharacterById: async (characterId: string): Promise<CharacterDto | null> => {
    try {
      const response = await api.GET('/api/characters/{characterId}', {
        params: { path: { characterId } },
      });
      return getData<CharacterDto>(response);
    } catch {
      return null;
    }
  },

  /**
   * Update a character
   */
  saveCharacter: async (characterId: string, updates: UpdateCharacterRequestDto) => {
    const response = await api.PUT('/api/characters/{characterId}', {
      params: { path: { characterId } },
      body: updates,
    });
    return getData(response);
  },

  /**
   * Delete a character
   */
  deleteCharacter: async (characterId: string): Promise<void> => {
    await api.DELETE('/api/characters/{characterId}', {
      params: { path: { characterId } },
    });
  },

  /**
   * Mark a character as deceased
   */
  killCharacter: async (characterId: string, deathLocation?: string): Promise<CharacterDto> => {
    const response = await api.POST('/api/characters/{characterId}/kill', {
      params: { path: { characterId } },
      body: { deathLocation },
    });
    return getData<CharacterDto>(response);
  },

  /**
   * Get all deceased characters
   */
  getDeceasedCharacters: async (): Promise<CharacterDto[]> => {
    const response = await api.GET('/api/characters/deceased');
    return getData<CharacterDto[]>(response);
  },

  /**
   * Add an item to character's inventory
   */
  addInventoryItem: async (characterId: string, item: Partial<ItemDto>): Promise<CharacterDto> => {
    const response = await api.POST('/api/characters/{characterId}/inventory', {
      params: { path: { characterId } },
      body: toOpenApiInventoryItem(item),
    });
    return getData<CharacterDto>(response);
  },

  /**
   * Update an item in character's inventory
   */
  updateInventoryItem: async (characterId: string, itemId: string, updates: CreateInventoryItemDto): Promise<CharacterDto> => {
    const response = await api.PATCH('/api/characters/{characterId}/inventory/{itemId}', {
      params: { path: { characterId, itemId } },
      body: updates,
    });
    return getData<CharacterDto>(response);
  },

  /**
   * Remove an item from character's inventory
   */
  removeInventoryItem: async (characterId: string, itemId: string, qty?: number): Promise<CharacterDto> => {
    const response = await api.DELETE('/api/characters/{characterId}/inventory/{itemId}', {
      params: { path: { characterId, itemId } },
      body: { qty },
    });
    return getData<CharacterDto>(response);
  },

  /**
   * Grant inspiration point(s) to a character
   */
  grantInspiration: async (characterId: string, amount = 1): Promise<CharacterDto> => {
    const response = await api.POST('/api/characters/{characterId}/inspiration/grant', {
      params: { path: { characterId } },
      body: { amount },
    });
    const result = getData<{ character: CharacterDto }>(response);
    return result.character;
  },

  /**
   * Spend an inspiration point
   */
  spendInspiration: async (characterId: string): Promise<CharacterDto> => {
    const response = await api.POST('/api/characters/{characterId}/inspiration/spend', {
      params: { path: { characterId } },
    });
    const result = getData<{ character: CharacterDto }>(response);
    return result.character;
  },

  /**
   * Generate character avatar
   */
  generateAvatar: async (characterId: string): Promise<string> => {
    const response = await api.POST('/api/image/generate-avatar', {
      body: { characterId },
    });
    const result = getData<{ imageUrl: string }>(response);
    return result.imageUrl;
  },

  /**
   * Get item definitions
   */
  getItemDefinitions: async (): Promise<unknown[]> => {
    const response = await api.GET('/api/items');
    return getData<unknown[]>(response);
  },
};

// Re-export with compatible name for drop-in replacement
export { characterApi as characterServiceApi };
