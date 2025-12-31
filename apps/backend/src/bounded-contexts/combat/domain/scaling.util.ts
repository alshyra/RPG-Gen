/**
 * Combat Scaling Utilities
 * 
 * This module provides type definitions and simple utility functions for combat.
 * 
 * IMPORTANT: All damage, healing, and HP calculations are now handled by
 * FormulasService in the game-data bounded context. This ensures the game
 * is fully configurable through seed data.
 * 
 * @see FormulasService for all calculation logic
 * @see formulas.json for configurable parameters
 * @see ClassStats for HP calculations
 * @see Aptitude for power/damage calculations
 */

/**
 * Interface for class stats needed by other modules.
 * This mirrors the structure from game-data ClassStats value object.
 */
export interface ClassStatsInput {
  hpBase: number;
  hpGain: number;
  pa: number;
  pm: number;
}

/**
 * Calculate total PA including equipment bonuses.
 * Simple addition - no formula needed.
 */
export function calculateTotalPA(basePa: number, equipmentBonus: number = 0): number {
  return basePa + equipmentBonus;
}

/**
 * Calculate total PM including equipment bonuses.
 * Simple addition - no formula needed.
 */
export function calculateTotalPM(basePm: number, equipmentBonus: number = 0): number {
  return basePm + equipmentBonus;
}

/**
 * Validate that an aptitude's PA cost doesn't exceed the class's max PA
 */
export function validateAptitudeCost(aptitudePaCost: number, maxPa: number): boolean {
  return aptitudePaCost <= maxPa;
}
