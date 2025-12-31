import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CombatSession } from "../../infrastructure/persistence/mongo/schemas/CombatSession.js";
import type { EnemyAttackLogDto } from "../../api/dto/response/EnemyAttackLogDto.js";
import type { CombatStateDto, CombatantDto } from "../../api/dto/response/index.js";
import { FormulasService } from "../../../game-data/application/services/FormulasService.js";

/**
 * EnemyTurnService - Manages enemy turns in the tactical system
 * 
 * Key design:
 * - NO attack rolls (hits are automatic)
 * - Damage is calculated using FormulasService (data from seeds)
 * - Enemies have PA/PM like players
 * - All damage is deterministic (no RNG)
 * 
 * @see FormulasService for damage calculation
 * @see formulas.json for configurable parameters
 */
@Injectable()
export class EnemyTurnService {
  private readonly logger = new Logger(EnemyTurnService.name);

  constructor(
    @InjectModel(CombatSession.name) private readonly combatSessionModel: Model<CombatSession>,
    private readonly formulasService: FormulasService,
  ) {}

  /**
   * Execute a single enemy attack against the player using the new scaling system.
   * No attack rolls - damage is calculated directly from stats.
   *
   * @param characterId Player character ID
   * @param enemy The attacking enemy
   * @returns Attack log entry, damage dealt, and whether player was defeated
   */
  async executeEnemyAttack(
    characterId: string,
    enemy: CombatantDto,
  ): Promise<{
    log: EnemyAttackLogDto;
    damage: number;
    playerDefeated: boolean;
  }> {
    // Get default values from formulas.json for missing enemy properties
    const enemyDefaults = this.formulasService.getEnemyDefaults();
    
    // Calculate damage using FormulasService with data from enemy or defaults
    const basePower = enemy.basePower ?? enemyDefaults.basePower;
    const scalingAttribute = enemy.scalingAttribute ?? enemyDefaults.scalingAttribute;
    const stats = enemy.stats ?? enemyDefaults.stats;
    const level = enemy.level ?? enemyDefaults.level;

    // Get scaling stat value
    const scalingValue = stats[scalingAttribute] ?? 0;
    const damage = this.formulasService.calculateDamage(basePower, scalingValue, level);

    const attackLog: EnemyAttackLogDto = {
      attackerId: enemy.id,
      attackerName: enemy.name,
      targetId: characterId,
      hit: true, // Always hits in new system
      isCrit: false, // No crits in base system
      damageTotal: damage,
    };

    // Apply damage to player via persistence
    const session = await this.combatSessionModel.findOne({ characterId });
    if (!session) {
      throw new Error(`Combat session not found for character ${characterId}`);
    }

    const previousHp = session.player.hp ?? 0;
    session.player.hp = Math.max(0, previousHp - damage);
    await session.save();

    this.logger.debug(
      `${enemy.name} attacks player for ${damage} damage (${previousHp} -> ${session.player.hp})`,
    );

    return {
      log: attackLog,
      damage,
      playerDefeated: session.player.hp <= 0,
    };
  }

  /**
   * Execute a sequence of enemy attacks in turn order.
   * Each enemy spends PA to attack (if they have enough).
   *
   * @param characterId Character being attacked
   * @param state Current combat state
   * @param enemies List of enemies to attack in sequence
   * @returns Updated state, attack logs, total damage, and defeat status
   */
  async executeEnemyTurnsSequence(
    characterId: string,
    state: CombatStateDto,
    enemies: CombatantDto[],
  ): Promise<{
    state: CombatStateDto;
    attackLogs: EnemyAttackLogDto[];
    totalDamage: number;
    playerDefeated: boolean;
  }> {
    const attackLogs: EnemyAttackLogDto[] = [];
    let totalDamage = 0;
    let playerDefeated = false;
    
    // Get default PA from formulas.json
    const enemyDefaults = this.formulasService.getEnemyDefaults();

    for (const enemy of enemies) {
      // Skip dead enemies
      if ((enemy.hp ?? 0) <= 0) continue;
      
      // Stop if player is already defeated
      if (playerDefeated) break;

      // Check if enemy has PA to attack (default from formulas.json)
      const enemyPA = enemy.pa ?? enemyDefaults.pa;
      if (enemyPA <= 0) continue;

      // Execute attack
      const attackResult = await this.executeEnemyAttack(characterId, enemy);
      
      attackLogs.push(attackResult.log);
      totalDamage += attackResult.damage;
      playerDefeated = attackResult.playerDefeated;

      // Deduct PA from enemy (for future multi-attack support)
      enemy.pa = enemyPA - 1;
    }

    // Fetch fresh state to reflect HP changes
    const freshSession = await this.combatSessionModel.findOne({ characterId });
    if (freshSession?.player) {
      state.player.hp = freshSession.player.hp ?? 0;
    }

    return {
      state,
      attackLogs,
      totalDamage,
      playerDefeated,
    };
  }
}
