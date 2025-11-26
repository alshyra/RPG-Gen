/**
 * Character Service using OpenAPI-fetch client
 * Type-safe API calls for character management
 */
import type { CharacterDto, ItemDto, components } from '@rpg-gen/shared';
import { api } from './apiClient';

// Type alias for OpenAPI inventory item type
type OpenApiInventoryItem = components['schemas']['CreateInventoryItemDto'];

// Helper to extract data from openapi-fetch response
const getData = <T>(response: { data?: T; error?: unknown }): T => {
  if (response.error) {
    throw response.error;
  }
  return response.data as T;
};

// Convert ItemDto to OpenAPI CreateInventoryItemDto format
const toOpenApiInventoryItem = (item: Partial<ItemDto>): OpenApiInventoryItem => ({
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
  createCharacter: async (world: string): Promise<CharacterDto> => {
    // Use fetch directly since the endpoint body type is not properly typed in OpenAPI
    const response = await fetch(`${import.meta.env.VITE_API_URL || `${window.location.origin}/api`}/characters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('rpg-auth-token') || ''}`,
      },
      body: JSON.stringify({ world }),
    });
    if (!response.ok) throw new Error('Failed to create character');
    return response.json();
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
  saveCharacter: async (characterId: string, updates: Partial<CharacterDto>): Promise<CharacterDto> => {
    // Use fetch directly since the endpoint body type is not properly typed in OpenAPI
    const response = await fetch(`${import.meta.env.VITE_API_URL || `${window.location.origin}/api`}/characters/${characterId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('rpg-auth-token') || ''}`,
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to save character');
    return response.json();
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
    // Use fetch directly since the endpoint body type is not properly typed in OpenAPI
    const response = await fetch(`${import.meta.env.VITE_API_URL || `${window.location.origin}/api`}/characters/${characterId}/kill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('rpg-auth-token') || ''}`,
      },
      body: JSON.stringify({ deathLocation }),
    });
    if (!response.ok) throw new Error('Failed to kill character');
    return response.json();
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
  updateInventoryItem: async (characterId: string, itemId: string, updates: Partial<ItemDto>): Promise<CharacterDto> => {
    // Use fetch directly since the endpoint body type is not properly typed in OpenAPI
    const response = await fetch(`${import.meta.env.VITE_API_URL || `${window.location.origin}/api`}/characters/${characterId}/inventory/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('rpg-auth-token') || ''}`,
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update inventory item');
    return response.json();
  },

  /**
   * Remove an item from character's inventory
   */
  removeInventoryItem: async (characterId: string, itemId: string, qty?: number): Promise<CharacterDto> => {
    // Use fetch with body in DELETE request
    const response = await fetch(`${import.meta.env.VITE_API_URL || `${window.location.origin}/api`}/characters/${characterId}/inventory/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('rpg-auth-token') || ''}`,
      },
      body: JSON.stringify({ qty }),
    });
    if (!response.ok) throw new Error('Failed to remove inventory item');
    return response.json();
  },

  /**
   * Grant inspiration point(s) to a character
   */
  grantInspiration: async (characterId: string, amount = 1): Promise<CharacterDto> => {
    // Use fetch directly since the endpoint body type is not properly typed in OpenAPI
    const response = await fetch(`${import.meta.env.VITE_API_URL || `${window.location.origin}/api`}/characters/${characterId}/inspiration/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('rpg-auth-token') || ''}`,
      },
      body: JSON.stringify({ amount }),
    });
    if (!response.ok) throw new Error('Failed to grant inspiration');
    const result = await response.json();
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
