import type {
  CharacterResponseDto,
  CreateCharacterBodyDto,
  UpdateCharacterRequestDto,
  KillCharacterBodyDto,
  CreateInventoryItemDto,
  EquipInventoryDto,
  RemoveInventoryBodyDto,
  GrantInspirationBodyDto,
  InspirationResponseDto,
  LevelUpApplyDto,
  DeceasedCharacterResponseDto,
} from '@rpg-gen/shared';
import { apiClient, getData } from './index.js';

export const characterApi = {
  /**
   * Create a new character
   */
  async create(body: CreateCharacterBodyDto): Promise<CharacterResponseDto> {
    const response = await apiClient.POST('/api/characters', { body });
    return getData(response);
  },

  /**
   * Get all characters for current user
   */
  async findAll(): Promise<CharacterResponseDto[]> {
    const response = await apiClient.GET('/api/characters');
    return getData(response);
  },

  /**
   * Get all deceased characters
   */
  async getDeceased(): Promise<DeceasedCharacterResponseDto[]> {
    const response = await apiClient.GET('/api/characters/deceased');
    return getData(response);
  },

  /**
   * Get character by ID
   */
  async findOne(characterId: string): Promise<CharacterResponseDto> {
    const response = await apiClient.GET('/api/characters/{characterId}', {
      params: { path: { characterId } },
    });
    return getData(response);
  },

  /**
   * Update character
   */
  async update(
    characterId: string,
    body: UpdateCharacterRequestDto,
  ): Promise<CharacterResponseDto> {
    const response = await apiClient.PUT('/api/characters/{characterId}', {
      params: { path: { characterId } },
      body,
    });
    return getData(response);
  },

  /**
   * Delete character
   */
  async delete(characterId: string): Promise<object> {
    const response = await apiClient.DELETE('/api/characters/{characterId}', {
      params: { path: { characterId } },
    });
    return getData(response);
  },

  /**
   * Mark character as deceased
   */
  async kill(characterId: string, body: KillCharacterBodyDto): Promise<CharacterResponseDto> {
    const response = await apiClient.POST('/api/characters/{characterId}/kill', {
      params: { path: { characterId } },
      body,
    });
    return getData(response);
  },

  /**
   * Add item to inventory
   */
  async addInventory(
    characterId: string,
    item: CreateInventoryItemDto,
  ): Promise<CharacterResponseDto> {
    const response = await apiClient.POST('/api/characters/{characterId}/inventory', {
      params: { path: { characterId } },
      body: item,
    });
    return getData(response);
  },

  /**
   * Update inventory item
   */
  async updateInventory(
    characterId: string,
    itemId: string,
    item: CreateInventoryItemDto,
  ): Promise<CharacterResponseDto> {
    const response = await apiClient.PATCH('/api/characters/{characterId}/inventory/{itemId}', {
      params: { path: { characterId, itemId } },
      body: item,
    });
    return getData(response);
  },

  /**
   * Remove inventory item
   */
  async removeInventory(
    characterId: string,
    itemId: string,
    body: RemoveInventoryBodyDto,
  ): Promise<CharacterResponseDto> {
    const response = await apiClient.DELETE('/api/characters/{characterId}/inventory/{itemId}', {
      params: { path: { characterId, itemId } },
      body,
    });
    return getData(response);
  },

  /**
   * Equip item
   */
  async equipItem(characterId: string, body: EquipInventoryDto): Promise<CharacterResponseDto> {
    const response = await apiClient.POST('/api/characters/{characterId}/inventory/equip', {
      params: { path: { characterId } },
      body,
    });
    return getData(response);
  },

  /**
   * Grant inspiration points
   */
  async grantInspiration(
    characterId: string,
    body: GrantInspirationBodyDto,
  ): Promise<InspirationResponseDto> {
    const response = await apiClient.POST('/api/characters/{characterId}/inspiration/grant', {
      params: { path: { characterId } },
      body,
    });
    return getData(response);
  },

  /**
   * Spend inspiration point
   */
  async spendInspiration(characterId: string): Promise<InspirationResponseDto> {
    const response = await apiClient.POST('/api/characters/{characterId}/inspiration/spend', {
      params: { path: { characterId } },
    });
    return getData(response);
  },

  /**
   * Apply level up
   */
  async applyLevelUp(
    characterId: string,
    className: string,
    body: LevelUpApplyDto,
  ): Promise<CharacterResponseDto> {
    const response = await apiClient.POST('/api/characters/{characterId}/levelup/{className}', {
      params: { path: { characterId, className } },
      body,
    });
    return getData(response);
  },
};
