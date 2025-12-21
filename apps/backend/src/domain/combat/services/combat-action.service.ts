import { Injectable, Logger } from "@nestjs/common";
import {
  calculateDamage,
  calculateHealing,
  calculateMaxHP,
} from "../scaling.util.js";
import { type StatAttribute } from "../../character/dto/StatAttribute.js";

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
 * CombatActionService - Applies the unified scaling system to combat actions
 * 
 * This service integrates the scaling.util functions into actual combat gameplay:
 * - Damage calculations use: (basePower + Attribut) * (1 + (Level - 1) * 0.15)
 * - Healing uses the same formula
 * - All calculations are deterministic (no RNG)
 */
@Injectable()
export class CombatActionService {
  private readonly logger = new Logger(CombatActionService.name);

  /**
   * Calculate damage for an aptitude action
   * This is the integration point for the scaling system
   */
  calculateAptitudeDamage(
    basePower: number,
    scalingAttribute: StatAttribute | null,
    characterStats: Record<string, number>,
    level: number,
  ): number {
    return calculateDamage(basePower, scalingAttribute, characterStats as any, level);
  }

  /**
   * Calculate healing for an aptitude action
   * Uses the same scaling formula as damage
   */
  calculateAptitudeHealing(
    basePower: number,
    scalingAttribute: StatAttribute | null,
    characterStats: Record<string, number>,
    level: number,
  ): number {
    return calculateHealing(basePower, scalingAttribute, characterStats as any, level);
  }

  /**
   * Get max HP for a character (used for healing caps)
   */
  getMaxHP(className: string, level: number, survival: number): number {
    return calculateMaxHP(className, level, survival);
  }

  /**
   * Calculate total damage or healing from an action
   * This consolidates all the scaling logic in one place
   */
  calculateActionEffect(
    basePower: number,
    scalingAttribute: StatAttribute | null,
    characterStats: any,
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
