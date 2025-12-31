import { Injectable, Logger } from "@nestjs/common";
import { type StatAttribute } from "../../../character/api/dto/response/StatAttribute.js";
import type { CharacterStats } from "#shared";
import { ClassDataService } from "../../../game-data/application/services/ClassDataService.js";
import { FormulasService } from "../../../game-data/application/services/FormulasService.js";

export interface CombatAction {
  characterId: string;
  aptitudeId: string;
  targetIds: string[];
  targetPositions?: { x: number; y: number }[];
}

export type ActionResult = {
  success: boolean;
  damage?: number;
  healing?: number;
  targets: Array<{
    id: string;
    hpBefore: number;
    hpAfter: number;
    damage?: number;
    healing?: number;
  }>;
};

/**
 * CombatActionService - Applies combat actions using game-data formulas
 * 
 * This service uses FormulasService for all calculations:
 * - Damage calculations use configurable formulas from formulas.json
 * - Healing uses the same approach
 * - All calculations are deterministic (no RNG)
 * 
 * @see FormulasService for formula implementations
 * @see formulas.json for configurable parameters
 */
@Injectable()
export class CombatActionService {
  private readonly logger = new Logger(CombatActionService.name);

  constructor(
    private readonly classDataService: ClassDataService,
    private readonly formulasService: FormulasService,
  ) {}

  /**
   * Calculate damage for an aptitude action.
   * Uses FormulasService with configurable parameters from formulas.json.
   */
  calculateAptitudeDamage(
    basePower: number,
    scalingAttribute: StatAttribute | null,
    characterStats: CharacterStats | Record<string, number>,
    level: number,
  ): number {
    const scalingValue = scalingAttribute
      ? (characterStats[scalingAttribute] ?? 0)
      : 0;
    return this.formulasService.calculateDamage(basePower, scalingValue, level);
  }

  /**
   * Calculate healing for an aptitude action.
   * Uses FormulasService with configurable parameters from formulas.json.
   */
  calculateAptitudeHealing(
    basePower: number,
    scalingAttribute: StatAttribute | null,
    characterStats: CharacterStats | Record<string, number>,
    level: number,
  ): number {
    const scalingValue = scalingAttribute
      ? (characterStats[scalingAttribute] ?? 0)
      : 0;
    return this.formulasService.calculateHealing(basePower, scalingValue, level);
  }

  /**
   * Get max HP for a character (used for healing caps).
   * Fetches class stats from game-data and uses FormulasService for calculation.
   * @throws Error if class definition not found
   */
  async getMaxHP(className: string, level: number, survival: number): Promise<number> {
    const classDefinition = await this.classDataService.findByName(className);
    if (!classDefinition) {
      throw new Error(`Class ${className} not found in game data`);
    }
    const { hpBase, hpGain } = classDefinition.stats;
    return this.formulasService.calculateMaxHP(hpBase, hpGain, level, survival);
  }

  /**
   * Calculate total damage or healing from an action.
   * Delegates to appropriate method based on effect type.
   */
  calculateActionEffect(
    basePower: number,
    scalingAttribute: StatAttribute | null,
    characterStats: CharacterStats | Record<string, number>,
    level: number,
    isHealing: boolean = false,
  ): number {
    if (isHealing) {
      return this.calculateAptitudeHealing(basePower, scalingAttribute, characterStats, level);
    } else {
      return this.calculateAptitudeDamage(basePower, scalingAttribute, characterStats, level);
    }
  }
}
