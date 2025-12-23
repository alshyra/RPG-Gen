// src/shared/domain/types/ClassName.ts

export type ClassName = 'guerrier' | 'rogue' | 'mage';

export function isClassName(value: string): value is ClassName {
  return ['guerrier', 'rogue', 'mage'].includes(value);
}

export function parseClassName(value: string | undefined): ClassName | undefined {
  if (!value) return undefined;
  
  if (!isClassName(value)) {
    throw new Error(`Invalid ClassName: ${value}. Must be one of: guerrier, rogue, mage`);
  }
  
  return value;
}

export const ClassNames = {
  GUERRIER: 'guerrier' as ClassName,
  ROGUE: 'rogue' as ClassName,
  MAGE: 'mage' as ClassName,
} as const;
