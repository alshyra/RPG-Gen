import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { DiceService } from "../dice/dice.service.js";
import { CombatSession } from "../../infra/mongo/combat/CombatSession.js";
import type { EnemyAttackLogDto } from "./dto/EnemyAttackLogDto.js";
import type { CombatStateDto, CombatantDto } from "./dto/index.js";

/**
 * Domain service for enemy turn mechanics.
 * Pure combat logic: no cross-domain calls, no orchestrator dependency.
 * DiceService is passed as a parameter to remain testable and decoupled.
 */
@Injectable()
export class EnemyTurnService {
  constructor(
    @InjectModel(CombatSession.name) private readonly combatSessionModel: Model<CombatSession>,
  ) {}

  /**
   * Execute a single enemy attack against the player.
   * Returns attack log with damage applied to combat state.
   *
   * @param enemy The attacking enemy
   * @param playerAC Target's AC
   * @param diceService Injected by caller to maintain separation of concerns
   * @returns Attack log entry, damage dealt, and whether player was defeated
   */
  async executeEnemyAttack(
    characterId: string,
    enemy: CombatantDto,
    playerAC: number,
    diceService: DiceService,
  ): Promise<{
    log: EnemyAttackLogDto;
    damage: number;
    playerDefeated: boolean;
  }> {
    // Roll attack
    const attackRoll = diceService.rollAttack(enemy.attackBonus ?? 0, playerAC);

    const attackLog: EnemyAttackLogDto = {
      attackerId: enemy.id,
      attackerName: enemy.name,
      targetId: characterId,
      hit: attackRoll.hit,
      attackRoll: attackRoll.diceResult,
      isCrit: attackRoll.isCrit,
    };

    if (!attackRoll.hit) {
      return {
        log: attackLog,
        damage: 0,
        playerDefeated: false,
      };
    }

    // Roll damage if hit
    const damageResult = diceService.rollDamage(
      enemy.damageDice ?? "1d6",
      attackRoll.isCrit,
      enemy.damageBonus ?? 0,
    );
    attackLog.damageRoll = damageResult;
    attackLog.damageTotal = damageResult.damageTotal;

    // Apply damage to player via persistence
    const session = await this.combatSessionModel.findOne({ characterId });
    if (!session) {
      throw new Error(`Combat session not found for character ${characterId}`);
    }

    session.player.hp = Math.max(0, (session.player.hp ?? 0) - damageResult.damageTotal);
    await session.save();

    return {
      log: attackLog,
      damage: damageResult.damageTotal,
      playerDefeated: session.player.hp <= 0,
    };
  }

  /**
   * Execute a sequence of enemy attacks in turn order.
   * Stops if player is defeated.
   *
   * @param characterId Character being attacked
   * @param state Current combat state
   * @param enemies List of enemies to attack in sequence
   * @param diceService Injected by caller
   * @returns Updated state, attack logs, total damage, and defeat status
   */
  async executeEnemyTurnsSequence(
    characterId: string,
    state: CombatStateDto,
    enemies: CombatantDto[],
    diceService: DiceService,
  ): Promise<{
    state: CombatStateDto;
    attackLogs: EnemyAttackLogDto[];
    totalDamage: number;
    playerDefeated: boolean;
  }> {
    const result = await enemies.reduce(
      async (accPromise, enemy) => {
        const acc = await accPromise;
        if (acc.playerDefeated || (enemy.hp ?? 0) <= 0) return acc;

        const attackResult = await this.executeEnemyAttack(
          characterId,
          enemy,
          acc.state.player.ac,
          diceService,
        );

        // Fetch fresh state after attack to reflect HP changes
        const freshSession = await this.combatSessionModel.findOne({ characterId });
        if (freshSession && freshSession.player.hp) {
          acc.state.player.hp = freshSession.player.hp;
        }

        return {
          state: acc.state,
          attackLogs: [...acc.attackLogs, attackResult.log],
          totalDamage: acc.totalDamage + attackResult.damage,
          playerDefeated: attackResult.playerDefeated,
        };
      },
      Promise.resolve({
        state,
        attackLogs: [] as EnemyAttackLogDto[],
        totalDamage: 0,
        playerDefeated: false,
      }),
    );

    return result;
  }
}
