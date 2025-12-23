import { InventoryItemMeta } from "#character/api/dto/index.js";

/**
 * Command to add an item to character's inventory
 */
export interface AddInventoryItemCommand {
  definitionId: string;
  name?: string;
  qty?: number;
  description?: string;
  equipped?: boolean;
  meta?: InventoryItemMeta;
}