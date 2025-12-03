import {
  CombatStartInstructionMessageDto,
} from '@rpg-gen/shared';

/**
 * Type guard for combat start instruction
 */
export function isCombatStartInstruction(obj: unknown): obj is CombatStartInstructionMessageDto {
  if (typeof obj !== 'object' || obj === null) return false;
  const record = obj as Record<string, unknown>;
  if (!Array.isArray(record.combat_start)) return false;

  return record.combat_start.every((enemy: unknown) => {
    if (typeof enemy !== 'object' || enemy === null) return false;
    const e = enemy as Record<string, unknown>;
    return typeof e.name === 'string'
      && typeof e.hp === 'number'
      && typeof e.ac === 'number';
  });
}

// Combat end is handled via server responses (CombatEndResponseDto); the AI should not emit a combat_end instruction.
