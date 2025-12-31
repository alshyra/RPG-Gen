import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Game formulas configuration loaded from formulas.json seed file.
 * These define how all game calculations work.
 * 
 * Formulas documentation:
 * - Damage: (basePower + scalingStatValue) * levelMultiplier
 *   where levelMultiplier = levelMultiplierBase + (level - 1) * levelMultiplierGrowth
 * - Healing: Same formula as damage with healing-specific multipliers
 * - HP: hpBase + (level * hpGain) + (survival * survivalBonus)
 * - Initiative: d20 roll (baseDie) + finesse value
 * - Aptitude Power: basePower + floor(scalingStat / scalingDivisor) + proficiencyBonus
 */
export interface GameFormulas {
  combat: {
    damage: {
      levelMultiplierBase: number;
      levelMultiplierGrowth: number;
    };
    healing: {
      levelMultiplierBase: number;
      levelMultiplierGrowth: number;
    };
  };
  character: {
    hp: {
      survivalBonus: number;
    };
    initiative: {
      baseDie: number;
    };
  };
  aptitude: {
    power: {
      scalingDivisor: number;
    };
  };
  defaults: {
    enemy: {
      basePower: number;
      level: number;
      scalingAttribute: string;
      stats: {
        vigor: number;
        finesse: number;
        mind: number;
        survival: number;
      };
      pa: number;
    };
  };
}

/**
 * FormulasService - Provides access to game formulas from seed data
 * 
 * This service is the SINGLE SOURCE OF TRUTH for all game calculations.
 * All formulas are defined in formulas.json and applied at runtime.
 * 
 * Philosophy:
 * - Seeds contain DATA (base values, multipliers, formulas parameters)
 * - This service applies the formulas using seed data
 * - NO hardcoded calculation logic elsewhere in the codebase
 * 
 * @domain game-data
 */
@Injectable()
export class FormulasService implements OnModuleInit {
  private readonly logger = new Logger(FormulasService.name);
  private formulas!: GameFormulas;

  async onModuleInit(): Promise<void> {
    await this.loadFormulas();
  }

  private async loadFormulas(): Promise<void> {
    try {
      const assetsPath = join(__dirname, "../../assets/formulas.json");
      const content = await readFile(assetsPath, "utf-8");
      const data = JSON.parse(content);
      
      // Strip out comments and schema
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { $schema, _comment, ...formulas } = data;
      this.formulas = formulas;
      
      this.logger.log("Game formulas loaded from seed");
    } catch (error) {
      this.logger.error("Failed to load formulas.json, using defaults", error);
      this.formulas = this.getDefaultFormulas();
    }
  }

  private getDefaultFormulas(): GameFormulas {
    return {
      combat: {
        damage: {
          levelMultiplierBase: 1.0,
          levelMultiplierGrowth: 0.15,
        },
        healing: {
          levelMultiplierBase: 1.0,
          levelMultiplierGrowth: 0.15,
        },
      },
      character: {
        hp: {
          survivalBonus: 2,
        },
        initiative: {
          baseDie: 20,
        },
      },
      aptitude: {
        power: {
          scalingDivisor: 2,
        },
      },
      defaults: {
        enemy: {
          basePower: 5,
          level: 1,
          scalingAttribute: "vigor",
          stats: {
            vigor: 2,
            finesse: 2,
            mind: 2,
            survival: 2,
          },
          pa: 1,
        },
      },
    };
  }

  /**
   * Get default values for enemies that don't have all properties set.
   * These come from formulas.json defaults section.
   */
  getEnemyDefaults(): GameFormulas["defaults"]["enemy"] {
    return this.formulas.defaults.enemy;
  }

  /**
   * Get all game formulas
   */
  getFormulas(): GameFormulas {
    return this.formulas;
  }

  // ==========================================
  // DAMAGE & HEALING CALCULATIONS
  // ==========================================

  /**
   * Calculate damage for an aptitude.
   * Formula: (basePower + scalingStatValue) * levelMultiplier
   * 
   * @param basePower - From aptitude seed data
   * @param scalingStatValue - Value of the scaling stat (vigor, finesse, mind)
   * @param level - Character/enemy level
   * @returns Calculated damage (floored to integer)
   */
  calculateDamage(basePower: number, scalingStatValue: number, level: number): number {
    const { levelMultiplierBase, levelMultiplierGrowth } = this.formulas.combat.damage;
    const levelMultiplier = levelMultiplierBase + (level - 1) * levelMultiplierGrowth;
    const rawDamage = (basePower + scalingStatValue) * levelMultiplier;
    return Math.floor(rawDamage);
  }

  /**
   * Calculate healing for an aptitude.
   * Uses same formula as damage but with healing-specific multipliers.
   * 
   * @param basePower - From aptitude seed data
   * @param scalingStatValue - Value of the scaling stat
   * @param level - Character level
   * @returns Calculated healing (floored to integer)
   */
  calculateHealing(basePower: number, scalingStatValue: number, level: number): number {
    const { levelMultiplierBase, levelMultiplierGrowth } = this.formulas.combat.healing;
    const levelMultiplier = levelMultiplierBase + (level - 1) * levelMultiplierGrowth;
    const rawHealing = (basePower + scalingStatValue) * levelMultiplier;
    return Math.floor(rawHealing);
  }

  // ==========================================
  // CHARACTER STAT CALCULATIONS
  // ==========================================

  /**
   * Calculate maximum HP for a character.
   * Formula: hpBase + (level * hpGain) + (survival * survivalBonus)
   * 
   * @param hpBase - From class seed data
   * @param hpGain - From class seed data
   * @param level - Character level
   * @param survival - Survival stat value
   * @returns Maximum HP
   */
  calculateMaxHP(hpBase: number, hpGain: number, level: number, survival: number = 0): number {
    const { survivalBonus } = this.formulas.character.hp;
    return hpBase + (level * hpGain) + (survival * survivalBonus);
  }

  /**
   * Roll initiative for a combatant.
   * Formula: d20 roll + finesse value
   * 
   * @param finesse - Finesse stat value
   * @returns Initiative value
   */
  rollInitiative(finesse: number = 0): number {
    const { baseDie } = this.formulas.character.initiative;
    const roll = Math.floor(Math.random() * baseDie) + 1;
    return roll + finesse;
  }

  // ==========================================
  // APTITUDE CALCULATIONS
  // ==========================================

  /**
   * Calculate aptitude power with scaling.
   * Formula: basePower + floor(scalingStat / scalingDivisor) + proficiencyBonus
   * 
   * @param basePower - From aptitude seed data
   * @param scalingStatValue - Value of the scaling stat
   * @param proficiencyBonus - Optional proficiency bonus
   * @returns Calculated power
   */
  calculateAptitudePower(
    basePower: number,
    scalingStatValue: number,
    proficiencyBonus: number = 0,
  ): number {
    const { scalingDivisor } = this.formulas.aptitude.power;
    const scalingBonus = Math.floor(scalingStatValue / scalingDivisor);
    return basePower + scalingBonus + proficiencyBonus;
  }
}
