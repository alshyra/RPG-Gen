// src/shared/domain/stats/MainStat.ts

import { StatType, StatTypes } from './StatType.js';
import { CharacterStats, CharacterStatsUtils } from './CharacterStats.js';

/**
 * Value Object représentant la statistique principale d'une classe
 * 
 * @immutable
 * @description
 * Encapsule la logique de calcul des bonus basés sur la stat principale.
 * Utilisé par :
 * - Archetype : définit mainStat pour chaque classe
 * - Character : stocke et utilise mainStat pour les calculs
 * - Combat : calcule damage/spell scaling basé sur mainStat
 */
export class MainStat {
  private readonly _statType: StatType;

  private constructor(statType: StatType) {
    this._statType = statType;
  }

  get statType(): StatType { 
    return this._statType; 
  }

  get value(): StatType {
    return this._statType;
  }

  // ✅ Factory methods (type-safe)
  static vigor(): MainStat { 
    return new MainStat(StatTypes.VIGOR); 
  }

  static finesse(): MainStat { 
    return new MainStat(StatTypes.FINESSE); 
  }

  static mind(): MainStat { 
    return new MainStat(StatTypes.MIND); 
  }

  static survival(): MainStat { 
    return new MainStat(StatTypes.SURVIVAL); 
  }

  /**
   * Crée un MainStat depuis un StatType
   */
  static fromStatType(statType: StatType): MainStat {
    return new MainStat(statType);
  }

  /**
   * Parse un MainStat depuis une string
   * @throws Error si la valeur est invalide
   */
  static fromString(value: string | undefined): MainStat | undefined {
    if (!value) return undefined;

    switch (value) {
      case StatTypes.VIGOR: return MainStat.vigor();
      case StatTypes.FINESSE: return MainStat.finesse();
      case StatTypes.MIND: return MainStat.mind();
      case StatTypes.SURVIVAL: return MainStat.survival();
      default:
        throw new Error(`Invalid MainStat: ${value}`);
    }
  }

  // ✅ Logique métier : Calcul de bonus
  
  /**
   * Calcule le bonus de la stat principale pour un personnage
   * 
   * @example
   * const mainStat = MainStat.vigor();
   * const bonus = mainStat.calculateBonus({ vigor: 14, ... }); // 7
   */
  calculateBonus(stats: CharacterStats): number {
    return CharacterStatsUtils.getModifier(stats, this._statType);
  }

  /**
   * Calcule le scaling pour les dégâts basés sur la stat principale
   * 
   * @param stats - Stats du personnage
   * @param baseValue - Valeur de base (ex: dégâts de l'arme)
   * @param scalingFactor - Facteur de scaling (0.0 - 1.0)
   * 
   * @example
   * const mainStat = MainStat.vigor();
   * const damage = mainStat.calculateScaling(
   *   { vigor: 14, ... }, 
   *   10,    // base damage
   *   0.5    // 50% scaling
   * ); // 10 + (7 * 0.5) = 13.5
   */
  calculateScaling(
    stats: CharacterStats, 
    baseValue: number, 
    scalingFactor: number
  ): number {
    const bonus = this.calculateBonus(stats);
    return baseValue + (bonus * scalingFactor);
  }

  /**
   * Récupère la valeur de la stat principale
   */
  getValue(stats: CharacterStats): number {
    return CharacterStatsUtils.getStat(stats, this._statType);
  }

  // ✅ Méthodes d'affichage

  getDisplayName(): string {
    const names: Record<StatType, string> = {
      vigor: 'Vigueur',
      finesse: 'Finesse',
      mind: 'Esprit',
      survival: 'Survie',
    };
    return names[this._statType];
  }

  getIcon(): string {
    const icons: Record<StatType, string> = {
      vigor: '💪',
      finesse: '🎯',
      mind: '🧠',
      survival: '🛡️',
    };
    return icons[this._statType];
  }

  getDescription(): string {
    const descriptions: Record<StatType, string> = {
      vigor: 'Augmente les HP et les dégâts physiques',
      finesse: 'Augmente la précision et les dégâts de finesse',
      mind: 'Augmente les PA et les dégâts magiques',
      survival: 'Augmente les PM et la résistance',
    };
    return descriptions[this._statType];
  }

  equals(other: MainStat): boolean {
    return this._statType === other._statType;
  }

  toString(): string {
    return this._statType;
  }

  toJSON(): StatType {
    return this._statType;
  }
}
