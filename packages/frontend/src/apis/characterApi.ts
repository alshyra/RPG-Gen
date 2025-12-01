/**
 * Character Service using OpenAPI-fetch client
 * Type-safe API calls for character management
 */
import type {
  CharacterResponseDto, CreateInventoryItemDto, ItemResponseDto, UpdateCharacterRequestDto,
} from '@rpg-gen/shared';
import { api } from './apiClient';

// Helper to extract data from openapi-fetch response
const getData = <T>(response: {
  data?: T;
  error?: unknown;
}): T => {
  if (response.error) {
    throw response.error;
  }
  return response.data as T;
};

// Convert ItemDto to OpenAPI CreateInventoryItemDto format
const toOpenApiInventoryItem = (item: Partial<ItemResponseDto>): CreateInventoryItemDto => ({
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
    const response = await api.POST('/api/characters', { body: { world } });
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
  getCharacterById: async (characterId: string): Promise<CharacterResponseDto | null> => {
    try {
      const response = await api.GET('/api/characters/{characterId}', { params: { path: { characterId } } });
      return getData<CharacterResponseDto>(response);
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
    await api.DELETE('/api/characters/{characterId}', { params: { path: { characterId } } });
  },

  /**
   * Mark a character as deceased
   */
  killCharacter: async (characterId: string, deathLocation?: string): Promise<CharacterResponseDto> => {
    const response = await api.POST('/api/characters/{characterId}/kill', {
      params: { path: { characterId } },
      body: { deathLocation },
    });
    return getData<CharacterResponseDto>(response);
  },

  /**
   * Get all deceased characters
   */
  getDeceasedCharacters: async (): Promise<CharacterResponseDto[]> => {
    const response = await api.GET('/api/characters/deceased');
    return getData<CharacterResponseDto[]>(response);
  },

  /**
   * Add an item to character's inventory
   */
  addInventoryItem: async (characterId: string, item: Partial<ItemResponseDto>): Promise<CharacterResponseDto> => {
    const response = await api.POST('/api/characters/{characterId}/inventory', {
      params: { path: { characterId } },
      body: toOpenApiInventoryItem(item),
    });
    return getData<CharacterResponseDto>(response);
  },

  /**
   * Equip an item by its definitionId using the dedicated backend endpoint.
   */
  equipInventoryItem: async (characterId: string, definitionId: string): Promise<CharacterResponseDto> => {
    const response = await api.POST('/api/characters/{characterId}/inventory/equip', {
      params: { path: { characterId } },
      body: { definitionId },
    });
    return getData<CharacterResponseDto>(response);
  },

  /**
   * Update an item in character's inventory
   */
  updateInventoryItem: async (characterId: string, itemId: string, updates: CreateInventoryItemDto): Promise<CharacterResponseDto> => {
    const response = await api.PATCH('/api/characters/{characterId}/inventory/{itemId}', {
      params: {
        path: {
          characterId,
          itemId,
        },
      },
      body: updates,
    });
    return getData<CharacterResponseDto>(response);
  },

  /**
   * Remove an item from character's inventory
   */
  removeInventoryItem: async (characterId: string, itemId: string, qty?: number): Promise<CharacterResponseDto> => {
    const response = await api.DELETE('/api/characters/{characterId}/inventory/{itemId}', {
      params: {
        path: {
          characterId,
          itemId,
        },
      },
      body: { qty },
    });
    return getData<CharacterResponseDto>(response);
  },

  /**
   * Grant inspiration point(s) to a character
   */
  grantInspiration: async (characterId: string, amount = 1): Promise<CharacterResponseDto> => {
    const response = await api.POST('/api/characters/{characterId}/inspiration/grant', {
      params: { path: { characterId } },
      body: { amount },
    });
    const result = getData<{ character: CharacterResponseDto }>(response);
    return result.character;
  },

  /**
   * Spend an inspiration point
   */
  spendInspiration: async (characterId: string): Promise<CharacterResponseDto> => {
    const response = await api.POST('/api/characters/{characterId}/inspiration/spend', { params: { path: { characterId } } });
    const result = getData<{ character: CharacterResponseDto }>(response);
    return result.character;
  },

  /**
   * Generate character avatar
   */
  generateAvatar: async (characterId: string): Promise<string> => {
    const response = await api.POST('/api/image/generate-avatar', { body: { characterId } });
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
