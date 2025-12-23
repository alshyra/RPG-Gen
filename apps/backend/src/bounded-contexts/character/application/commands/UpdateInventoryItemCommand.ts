import { InventoryItemMeta } from "#character/api/dto/index.js";

/**
 * Command to update an existing inventory item
 */
export interface UpdateInventoryItemCommand {
  definitionId?: string;
  name?: string;
  qty?: number;
  description?: string;
  equipped?: boolean;
  meta?: InventoryItemMeta;
}