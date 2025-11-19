// GENERATED FROM backend/src/schemas - do not edit manually


export interface InventoryItemDto {
  name: string;
  quantity: number;
  description?: string;
  weight?: number;
  value?: number;
  equipped?: boolean;
}
export type CreateInventoryItemDto = Partial<InventoryItemDto>;
export type UpdateInventoryItemDto = Partial<CreateInventoryItemDto>;
