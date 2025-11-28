import { CombatEndInstructionMessageDto, CombatStartInstructionMessageDto } from '@rpg-gen/shared';

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

/**
 * Type guard for combat end instruction
 */
export function isCombatEndInstruction(obj: unknown): obj is CombatEndInstructionMessageDto {
  if (typeof obj !== 'object' || obj === null) return false;
  const record = obj as Record<string, unknown>;
  if (typeof record.combat_end !== 'object' || record.combat_end === null) return false;

  const combatEnd = record.combat_end as Record<string, unknown>;
  return typeof combatEnd.victory === 'boolean'
    && typeof combatEnd.xp_gained === 'number'
    && typeof combatEnd.player_hp === 'number'
    && Array.isArray(combatEnd.enemies_defeated);
}
