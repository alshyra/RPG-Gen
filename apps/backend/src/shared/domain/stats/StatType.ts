// src/shared/domain/stats/StatType.ts

/**
 * Type représentant une statistique de personnage
 * 
 * @description
 * Les 4 statistiques fondamentales du système de jeu :
 * - vigor: Force physique, HP
 * - finesse: Agilité, précision
 * - mind: Intelligence, magie
 * - survival: Endurance, ressources
 */
export type StatType = 'vigor' | 'finesse' | 'mind' | 'survival';

/**
 * Type guard pour vérifier si une string est un StatType valide
 */
export function isStatType(value: string): value is StatType {
  return ['vigor', 'finesse', 'mind', 'survival'].includes(value);
}

/**
 * Parse et valide un StatType depuis une string
 * @throws Error si la valeur n'est pas valide
 */
export function parseStatType(value: string | undefined): StatType | undefined {
  if (!value) return undefined;
  
  if (!isStatType(value)) {
    throw new Error(`Invalid StatType: ${value}. Must be one of: vigor, finesse, mind, survival`);
  }
  
  return value;
}

/**
 * Constantes pour éviter les magic strings
 */
export const StatTypes = {
  VIGOR: 'vigor' as StatType,
  FINESSE: 'finesse' as StatType,
  MIND: 'mind' as StatType,
  SURVIVAL: 'survival' as StatType,
} as const;

/**
 * Labels d'affichage pour chaque stat
 */
export const StatTypeLabels: Record<StatType, string> = {
  vigor: 'Vigueur',
  finesse: 'Finesse',
  mind: 'Esprit',
  survival: 'Survie',
};

/**
 * Icônes pour chaque stat
 */
export const StatTypeIcons: Record<StatType, string> = {
  vigor: '💪',
  finesse: '🎯',
  mind: '🧠',
  survival: '🛡️',
};
