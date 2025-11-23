// GENERATED FROM backend/src/schemas - do not edit manually


export interface ItemDto {
  name: string;
  qty: number;
  description?: string;
  equipped?: boolean;
  meta: Record<string, any>;
}
export type CreateItemDto = Omit<ItemDto, '_id'>;
export type UpdateItemDto = Partial<CreateItemDto>;
