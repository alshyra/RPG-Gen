/**
 * Character Inventory Store Module
 * Domain-specific refs and logic for inventory management
 */

import { characterApi } from '@rpg-gen/api-client';
import type { CharacterResponseDto, InventoryItemDto } from '@rpg-gen/shared';
import type { Ref } from 'vue';

// Helper to update inventory quantity locally
const updateInventoryQuantity = (
  inventory: InventoryItemDto[] | undefined,
  definitionId: string,
  quantity: number,
): InventoryItemDto[] =>
  (inventory ?? [])
    .map(item => {
      if (item.definitionId !== definitionId) return item;
      return {
        ...item,
        qty: (item.qty ?? 1) - quantity,
      };
    })
    .filter(i => (i.qty ?? 0) > 0);

const findItemByIdentifier = (
  inventory: InventoryItemDto[],
  identifier: string,
): InventoryItemDto | undefined =>
  inventory.find(
    i => i._id === identifier || i.definitionId === identifier || i.name === identifier,
  );

const isItemUsable = (item: InventoryItemDto): boolean => {
  // Check if meta is consumable type with usable property
  if (item.meta && 'type' in item.meta && item.meta.type === 'consumable') {
    return !!(item.meta as { usable?: boolean }).usable;
  }
  return false;
};

/**
 * Create inventory management functions for a character ref
 */
export function createInventoryManager(currentCharacter: Ref<CharacterResponseDto | undefined>) {
  const removeInventoryItem = async (
    definitionId: InventoryItemDto['definitionId'],
    quantity = 1,
  ) => {
    if (!currentCharacter.value?.characterId || !definitionId) return;
    currentCharacter.value.inventory = updateInventoryQuantity(
      currentCharacter.value.inventory,
      definitionId,
      quantity,
    );
    const updated = await characterApi.removeInventory(
      currentCharacter.value.characterId,
      definitionId,
      { qty: quantity },
    );
    currentCharacter.value = updated;
  };

  const addInventoryItem = async (item: InventoryItemDto) => {
    if (!currentCharacter.value?.characterId || !item || !item.definitionId) return;
    const updated = await characterApi.addInventory(currentCharacter.value.characterId, item);
    currentCharacter.value = updated;
  };

  const useInventoryItem = async (itemIdentifier: string) => {
    if (!currentCharacter.value) return undefined;
    const item = findItemByIdentifier(currentCharacter.value.inventory ?? [], itemIdentifier);
    if (!item || !isItemUsable(item)) return undefined;
    return removeInventoryItem(item._id ?? item.definitionId, 1);
  };

  return {
    addInventoryItem,
    removeInventoryItem,
    useInventoryItem,
  };
}
