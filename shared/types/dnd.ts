/**
 * Shared D&D 5e rules types used across frontend and backend
 */

/**
 * D&D level with XP thresholds and proficiency bonus
 */
export interface DndLevel {
  level: number;
  totalXp: number;
  proficiencyBonus: number;
}

/**
 * Level up result with all changes
 */
export interface LevelUpResult {
  success: boolean;
  newLevel: number;
  hpGain: number;
  hasASI: boolean;
  newFeatures: string[];
  proficiencyBonus: number;
  message: string;
}
