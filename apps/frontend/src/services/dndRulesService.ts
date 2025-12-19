/**
 * Simplified rules service for the new talent tree system.
 * Replaces the old D&D 5e specific logic.
 */

export const GENDERS = ["male", "female"] as const;

export const CLASSES_LIST = ["Guerrier", "Rogue", "Mage"] as const;

export class DnDRulesService {
  /**
   * Calculate ability modifier from score.
   * Formula: floor((score - 10) / 2)
   */
  static getAbilityModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  /**
   * Get available skills for a class.
   * In the new system, this returns an empty array as skills are determined by aptitudes.
   */
  static getAvailableSkillsForClass(_className: string): string[] {
    return [];
  }
}
