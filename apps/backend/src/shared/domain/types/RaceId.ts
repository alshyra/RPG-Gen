// src/shared/domain/types/RaceId.ts

export type RaceId = 'humain' | 'nain' | 'elfe' | 'dark_elfe' | 'orc';

export function isRaceId(value: string): value is RaceId {
  return ['humain', 'nain', 'elfe', 'dark_elfe', 'orc'].includes(value);
}

export function parseRaceId(value: string | undefined): RaceId | undefined {
  if (!value) return undefined;
  
  if (!isRaceId(value)) {
    throw new Error(`Invalid RaceId: ${value}. Must be one of: humain, nain, elfe, dark_elfe, orc`);
  }
  
  return value;
}

export const RaceIds = {
  HUMAIN: 'humain' as RaceId,
  NAIN: 'nain' as RaceId,
  ELFE: 'elfe' as RaceId,
  DARK_ELFE: 'dark_elfe' as RaceId,
  ORC: 'orc' as RaceId,
} as const;
