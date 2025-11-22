// GENERATED FROM backend/src/schemas - do not edit manually


export interface RaceDto {
  id?: string;
  name?: string;
  mods: Record<string, number>;
}
export type CreateRaceDto = Partial<RaceDto>;
export type UpdateRaceDto = Partial<CreateRaceDto>;
