/**
 * Type guards and union types for game instructions
 * These provide runtime type checking without using `as` casts
 */

import type { components } from './api-types';

type RollInstructionMessageDto = components['schemas']['RollInstructionMessageDto'];
type HpInstructionMessageDto = components['schemas']['HpInstructionMessageDto'];
type XpInstructionMessageDto = components['schemas']['XpInstructionMessageDto'];
type SpellInstructionMessageDto = components['schemas']['SpellInstructionMessageDto'];
type InventoryInstructionMessageDto = components['schemas']['InventoryInstructionMessageDto'];
type CombatStartInstructionMessageDto = components['schemas']['CombatStartInstructionMessageDto'];
type CombatEndInstructionMessageDto = components['schemas']['CombatEndInstructionMessageDto'];

/**
 * Union type for all game instructions
 */
export type GameInstructionDto
  = | RollInstructionMessageDto
    | HpInstructionMessageDto
    | XpInstructionMessageDto
    | SpellInstructionMessageDto
    | InventoryInstructionMessageDto
    | CombatStartInstructionMessageDto
    | CombatEndInstructionMessageDto;

/**
 * Type guard for unknown instruction objects
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Type guard for roll instructions
 */
export function isRollInstruction(instruction: unknown): instruction is RollInstructionMessageDto {
  return isObject(instruction) && instruction.type === 'roll' && typeof instruction.dices === 'string';
}

/**
 * Type guard for HP instructions
 */
export function isHpInstruction(instruction: unknown): instruction is HpInstructionMessageDto {
  return isObject(instruction) && instruction.type === 'hp' && typeof instruction.hp === 'number';
}

/**
 * Type guard for XP instructions
 */
export function isXpInstruction(instruction: unknown): instruction is XpInstructionMessageDto {
  return isObject(instruction) && instruction.type === 'xp' && typeof instruction.xp === 'number';
}

/**
 * Type guard for spell instructions
 */
export function isSpellInstruction(instruction: unknown): instruction is SpellInstructionMessageDto {
  return isObject(instruction) && instruction.type === 'spell' && typeof instruction.name === 'string';
}

/**
 * Type guard for inventory instructions
 */
export function isInventoryInstruction(instruction: unknown): instruction is InventoryInstructionMessageDto {
  return isObject(instruction) && instruction.type === 'inventory' && typeof instruction.name === 'string';
}

/**
 * Type guard for combat start instructions
 */
export function isCombatStartInstruction(instruction: unknown): instruction is CombatStartInstructionMessageDto {
  return isObject(instruction) && instruction.type === 'combat_start' && Array.isArray(instruction.combat_start);
}

/**
 * Type guard for combat end instructions
 */
export function isCombatEndInstruction(instruction: unknown): instruction is CombatEndInstructionMessageDto {
  return isObject(instruction) && instruction.type === 'combat_end' && isObject(instruction.combat_end);
}

/**
 * Type guard for any valid game instruction
 */
export function isGameInstruction(instruction: unknown): instruction is GameInstructionDto {
  return (
    isRollInstruction(instruction)
    || isHpInstruction(instruction)
    || isXpInstruction(instruction)
    || isSpellInstruction(instruction)
    || isInventoryInstruction(instruction)
    || isCombatStartInstruction(instruction)
    || isCombatEndInstruction(instruction)
  );
}

/**
 * Combat phase type (matches backend CombatPhase)
 */
export type CombatPhase = 'PLAYER_TURN' | 'AWAITING_DAMAGE_ROLL' | 'ENEMY_TURN' | 'COMBAT_ENDED';
