// src/shared/domain/stats/CharacterStats.ts

import { StatType } from './StatType.js';

/**
 * Interface représentant les statistiques d'un personnage
 * 
 * @description
 * Interface commune utilisée par tous les bounded contexts
 * pour accéder aux stats d'un personnage
 */
export interface CharacterStats {
  vigor: number;
  finesse: number;
  mind: number;
  survival: number;
}

/**
 * Utilitaires pour manipuler les stats
 */
export class CharacterStatsUtils {
  /**
   * Récupère la valeur d'une stat par son type
   */
  static getStat(stats: CharacterStats, statType: StatType): number {
    return stats[statType];
  }

  /**
   * Calcule le modificateur d'une stat (valeur / 2, arrondi vers le bas)
   */
  static getModifier(stats: CharacterStats, statType: StatType): number {
    return Math.floor(stats[statType] / 2);
  }

  /**
   * Calcule la somme totale des stats
   */
  static getTotal(stats: CharacterStats): number {
    return stats.vigor + stats.finesse + stats.mind + stats.survival;
  }

  /**
   * Valide que les stats sont dans les limites acceptables
   */
  static validate(stats: CharacterStats): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Vérifier que toutes les stats sont positives
    for (const statType of Object.keys(stats) as StatType[]) {
      if (stats[statType] < 0) {
        errors.push(`${statType} cannot be negative`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
