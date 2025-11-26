// GENERATED FROM backend - do not edit manually


export interface InventoryInstructionDataDto {
  action: 'add' | 'remove' | 'use';
  name: string;
  quantity?: number;
  description?: string;
}
