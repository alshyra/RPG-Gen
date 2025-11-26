// GENERATED FROM backend/src/schemas - do not edit manually


export interface ItemDefinitionDto {
  definitionId: string;
  name: string;
  description: string;
  meta: Record<string, any>;
  isEditable: boolean;
}
export type CreateItemDefinitionDto = Partial<ItemDefinitionDto>;
export type UpdateItemDefinitionDto = Partial<CreateItemDefinitionDto>;
