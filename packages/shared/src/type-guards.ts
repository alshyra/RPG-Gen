/**
 * Type guards and union types for game instructions
 * These provide runtime type checking without using `as` casts
 */

import type { components } from "./api-types";

// These instruction types are internal game structures not exposed via API
// They represent parsed instructions from narrative responses

/**
 * Roll instruction for dice rolls
 */
export interface RollInstructionMessageDto {
  type: "roll";
  dices: string;
  reason?: string;
}

/**
 * HP change instruction
 */
export interface HpInstructionMessageDto {
  type: "hp";
  hp: number;
  reason?: string;
}

/**
 * XP gain instruction
 */
export interface XpInstructionMessageDto {
  type: "xp";
  xp: number;
  reason?: string;
}

/**
 * Spell learn instruction
 */
export interface SpellInstructionMessageDto {
  type: "spell";
  name: string;
  description?: string;
}

/**
 * Inventory change instruction
 */
export interface InventoryInstructionMessageDto {
  type: "inventory";
  action: "add" | "remove";
  name: string;
  quantity?: number;
}

/**
 * Combat start instruction (uses existing CombatStartEntryDto from API)
 */
export interface CombatStartInstructionMessageDto {
  type: "combat_start";
  combat_start: components["schemas"]["CombatStartEntryDto"][];
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
  | CombatStartInstructionMessageDto;

/**
 * Type guard for unknown instruction objects
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Type guard for roll instructions
 */
export function isRollInstruction(instruction: unknown): instruction is RollInstructionMessageDto {
  return (
    isObject(instruction) && instruction.type === "roll" && typeof instruction.dices === "string"
  );
}

/**
 * Type guard for HP instructions
 */
export function isHpInstruction(instruction: unknown): instruction is HpInstructionMessageDto {
  return isObject(instruction) && instruction.type === "hp" && typeof instruction.hp === "number";
}

/**
 * Type guard for XP instructions
 */
export function isXpInstruction(instruction: unknown): instruction is XpInstructionMessageDto {
  return isObject(instruction) && instruction.type === "xp" && typeof instruction.xp === "number";
}

/**
 * Type guard for spell instructions
 */
export function isSpellInstruction(
  instruction: unknown,
): instruction is SpellInstructionMessageDto {
  return (
    isObject(instruction) && instruction.type === "spell" && typeof instruction.name === "string"
  );
}

/**
 * Type guard for inventory instructions
 */
export function isInventoryInstruction(
  instruction: unknown,
): instruction is InventoryInstructionMessageDto {
  return (
    isObject(instruction) &&
    instruction.type === "inventory" &&
    typeof instruction.name === "string"
  );
}

/**
 * Type guard for combat start instructions
 */
export function isCombatStartInstruction(
  instruction: unknown,
): instruction is CombatStartInstructionMessageDto {
  return (
    isObject(instruction) &&
    instruction.type === "combat_start" &&
    Array.isArray(instruction.combat_start)
  );
}

/**
 * Type guard for any valid game instruction
 */
export function isGameInstruction(instruction: unknown): instruction is GameInstructionDto {
  return (
    isRollInstruction(instruction) ||
    isHpInstruction(instruction) ||
    isXpInstruction(instruction) ||
    isSpellInstruction(instruction) ||
    isInventoryInstruction(instruction) ||
    isCombatStartInstruction(instruction)
  );
}
