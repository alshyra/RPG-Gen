// GENERATED FROM backend/src/schemas - do not edit manually


export interface SpellDto {
  name: string;
  level?: number;
  description?: string;
  meta: Record<string, any>;
}
export type CreateSpellDto = Partial<SpellDto>;
export type UpdateSpellDto = Partial<CreateSpellDto>;
