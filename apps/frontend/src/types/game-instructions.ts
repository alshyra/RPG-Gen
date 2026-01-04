/**
 * Game instruction types - used for processing AI narrative responses
 * These match the backend instruction DTOs but are defined locally since
 * they aren't exposed via OpenAPI (they're part of the narrative parsing logic)
 */

export interface RollInstructionMessageDto {
  [key: string]: unknown;
  type: "roll";
  dices: string;
  modifierLabel?: string;
  modifierValue?: number;
  reason?: string;
  advantage?: "none" | "advantage" | "disadvantage";
  meta?: Record<string, unknown>;
}

export interface HpInstructionMessageDto {
  [key: string]: unknown;
  type: "hp";
  hp: number;
}

export interface XpInstructionMessageDto {
  [key: string]: unknown;
  type: "xp";
  xp: number;
}

export interface SpellInstructionMessageDto {
  [key: string]: unknown;
  type: "spell";
  name: string;
  action?: string;
}

export interface InventoryInstructionMessageDto {
  [key: string]: unknown;
  type: "inventory";
  name: string;
  action: "add" | "remove" | "use";
  quantity?: number;
}

export interface CombatStartInstructionMessageDto {
  [key: string]: unknown;
  type: "combat_start";
  combat_start: Array<{
    name: string;
    hp: number;
    attack_bonus?: number;
    damage_dice?: string;
    damage_bonus?: number;
  }>;
}

export interface CombatEndInstructionMessageDto {
  [key: string]: unknown;
  type: "combat_end";
  victory: boolean;
  xp_gained: number;
}

/**
 * Union type for all game instructions
 */
export type GameInstructionDto =
  | RollInstructionMessageDto
  | HpInstructionMessageDto
  | XpInstructionMessageDto
  | SpellInstructionMessageDto
  | InventoryInstructionMessageDto
  | CombatStartInstructionMessageDto
  | CombatEndInstructionMessageDto;

/**
 * Type guards for instruction types
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isRollInstruction(instruction: unknown): instruction is RollInstructionMessageDto {
  return (
    isObject(instruction) && instruction.type === "roll" && typeof instruction.dices === "string"
  );
}

export function isHpInstruction(instruction: unknown): instruction is HpInstructionMessageDto {
  return isObject(instruction) && instruction.type === "hp" && typeof instruction.hp === "number";
}

export function isXpInstruction(instruction: unknown): instruction is XpInstructionMessageDto {
  return isObject(instruction) && instruction.type === "xp" && typeof instruction.xp === "number";
}

export function isSpellInstruction(
  instruction: unknown,
): instruction is SpellInstructionMessageDto {
  return (
    isObject(instruction) && instruction.type === "spell" && typeof instruction.name === "string"
  );
}

export function isInventoryInstruction(
  instruction: unknown,
): instruction is InventoryInstructionMessageDto {
  return (
    isObject(instruction) &&
    instruction.type === "inventory" &&
    typeof instruction.name === "string"
  );
}

export function isCombatStartInstruction(
  instruction: unknown,
): instruction is CombatStartInstructionMessageDto {
  return (
    isObject(instruction) &&
    instruction.type === "combat_start" &&
    Array.isArray(instruction.combat_start)
  );
}

export function isCombatEndInstruction(
  instruction: unknown,
): instruction is CombatEndInstructionMessageDto {
  return (
    isObject(instruction) &&
    instruction.type === "combat_end" &&
    typeof instruction.victory === "boolean"
  );
}
