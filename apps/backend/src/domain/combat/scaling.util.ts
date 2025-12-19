/**
 * Combat Scaling Utilities
 * 
 * Implements the unified damage and stat calculation formulas for the Talent Tree system.
 * Zero RNG on level up - all calculations are deterministic.
 */

import type { CharacterStats } from "../../infra/mongo/character/CharacterStats.js";

// Class base stats configuration
export interface ClassBaseStats {
  name: string;
  hp_base: number;
  hp_gain: number;
  pa: number;
  pm: number;
  main_stat: "vigor" | "finesse" | "mind";
}

// Constants for the three classes
export const CLASS_STATS: Record<string, ClassBaseStats> = {
  guerrier: {
    name: "guerrier",
    hp_base: 12,
    hp_gain: 8,
    pa: 6,
    pm: 4,
    main_stat: "vigor",
  },
  rogue: {
    name: "rogue",
    hp_base: 10,
    hp_gain: 6,
    pa: 5,
    pm: 6,
    main_stat: "finesse",
  },
  mage: {
    name: "mage",
    hp_base: 8,
    hp_gain: 4,
    pa: 5,
    pm: 5,
    main_stat: "mind",
  },
};

/**
 * Calculate maximum HP for a character based on class and level.
 * Formula: PV_Max = PV_Base_Classe + (Level * Gain_PV_Classe) + (Survie * 2)
 * 
 * @param className - The character's class (guerrier, rogue, mage)
 * @param level - Character level (1-20)
 * @param survival - Survival attribute value
 * @returns Maximum HP
 */
export function calculateMaxHP(
  className: string,
  level: number,
  survival: number = 0,
): number {
  const classStats = CLASS_STATS[className.toLowerCase()];
  if (!classStats) {
    throw new Error(`Unknown class: ${className}`);
  }

  // PV_Max = PV_Base + (Level * Gain_PV) + (Survie * 2)
  return classStats.hp_base + (level * classStats.hp_gain) + (survival * 2);
}

/**
 * Calculate damage for an aptitude based on character stats and level.
 * Formula: Dégâts = (basePower + Attribut_Scaling) * (1 + (Level - 1) * 0.15)
 * 
 * @param basePower - Base power from the aptitude definition
 * @param scalingAttribute - Which attribute to use for scaling (vigor, finesse, mind)
 * @param characterStats - The character's current stats
 * @param level - Character level
 * @returns Calculated damage value (floored to integer)
 */
export function calculateDamage(
  basePower: number,
  scalingAttribute: "vigor" | "finesse" | "mind" | "survival" | null,
  characterStats: CharacterStats,
  level: number,
): number {
  // Get the scaling attribute value
  const attributeValue = scalingAttribute 
    ? (characterStats[scalingAttribute] || 0)
    : 0;

  // Level multiplier: 1 + (Level - 1) * 0.15
  // Level 1 = 1.0x, Level 5 = 1.6x, Level 10 = 2.35x, Level 20 = 3.85x
  const levelMultiplier = 1 + (level - 1) * 0.15;

  // Final damage = (basePower + attributeValue) * levelMultiplier
  const rawDamage = (basePower + attributeValue) * levelMultiplier;

  return Math.floor(rawDamage);
}

/**
 * Calculate healing amount using the same formula as damage.
 * Healing typically scales with survival or mind.
 */
export function calculateHealing(
  basePower: number,
  scalingAttribute: "vigor" | "finesse" | "mind" | "survival" | null,
  characterStats: CharacterStats,
  level: number,
): number {
  return calculateDamage(basePower, scalingAttribute, characterStats, level);
}

/**
 * Get base PA for a class (fixed, can only be modified by equipment)
 */
export function getBasePA(className: string): number {
  const classStats = CLASS_STATS[className.toLowerCase()];
  return classStats?.pa || 5;
}

/**
 * Get base PM for a class (fixed, can only be modified by equipment)
 */
export function getBasePM(className: string): number {
  const classStats = CLASS_STATS[className.toLowerCase()];
  return classStats?.pm || 4;
}

/**
 * Calculate total PA including equipment bonuses
 */
export function calculateTotalPA(className: string, equipmentBonus: number = 0): number {
  return getBasePA(className) + equipmentBonus;
}

/**
 * Calculate total PM including equipment bonuses
 */
export function calculateTotalPM(className: string, equipmentBonus: number = 0): number {
  return getBasePM(className) + equipmentBonus;
}

/**
 * Get computed stats for a character (all final values)
 */
export interface ComputedCharacterStats {
  hpMax: number;
  paMax: number;
  pmMax: number;
  vigor: number;
  finesse: number;
  mind: number;
  survival: number;
  level: number;
  className: string;
}

export function getComputedStats(
  className: string,
  level: number,
  baseStats: CharacterStats,
  equipmentBonuses: { pa?: number; pm?: number; vigor?: number; finesse?: number; mind?: number; survival?: number } = {},
): ComputedCharacterStats {
  // Calculate final attribute values (base + equipment)
  const vigor = (baseStats.vigor || 0) + (equipmentBonuses.vigor || 0);
  const finesse = (baseStats.finesse || 0) + (equipmentBonuses.finesse || 0);
  const mind = (baseStats.mind || 0) + (equipmentBonuses.mind || 0);
  const survival = (baseStats.survival || 0) + (equipmentBonuses.survival || 0);

  return {
    hpMax: calculateMaxHP(className, level, survival),
    paMax: calculateTotalPA(className, equipmentBonuses.pa),
    pmMax: calculateTotalPM(className, equipmentBonuses.pm),
    vigor,
    finesse,
    mind,
    survival,
    level,
    className,
  };
}

/**
 * Validate that an aptitude's PA cost doesn't exceed the class's max PA
 */
export function validateAptitudeCost(
  aptitudePaCost: number,
  className: string,
): boolean {
  const maxPa = getBasePA(className);
  return aptitudePaCost <= maxPa;
}
