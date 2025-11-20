// GENERATED FROM backend/src/schemas - do not edit manually


export interface SpellDto {
  name: string;
  level: number;
  school: string;
  castingTime?: string;
  range?: string;
  components?: string;
  duration?: string;
  description?: string;
  prepared?: boolean;
}
export type CreateSpellDto = Partial<SpellDto>;
export type UpdateSpellDto = Partial<CreateSpellDto>;
