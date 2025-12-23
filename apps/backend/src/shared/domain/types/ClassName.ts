// src/shared/domain/types/ClassName.ts

export type ArchetypeName = 'guerrier' | 'rogue' | 'mage';

export function isArchetypeName(value: string): value is ArchetypeName {
  return ['guerrier', 'rogue', 'mage'].includes(value);
}

export function parseArchetypeName(value: string | undefined): ArchetypeName | undefined {
  if (!value) return undefined;
  
  if (!isArchetypeName(value)) {
    throw new Error(`Invalid ClassName: ${value}. Must be one of: guerrier, rogue, mage`);
  }
  
  return value;
}

export const ArchetypeNames = {
  GUERRIER: 'guerrier' as ArchetypeName,
  ROGUE: 'rogue' as ArchetypeName,
  MAGE: 'mage' as ArchetypeName,
} as const;
