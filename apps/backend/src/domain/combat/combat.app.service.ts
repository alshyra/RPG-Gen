import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import { CombatSession } from "../../infra/mongo/combat/CombatSession.js";
import type { CharacterResponseDto } from "../character/dto/index.js";
import { CombatantDto } from "./dto/CombatantDto.js";
import { CombatEndDto } from "./dto/CombatEndDto.js";
import { CombatStartRequestDto } from "./dto/CombatStartRequestDto.js";
import { CombatStateDto } from "./dto/CombatStateDto.js";
import { EnemyAttackLogDto } from "./dto/EnemyAttackLogDto.js";
import { ActionEconomyService } from "./services/action-economy.service.js";
import { InitService } from "./services/init.service.js";
import { TurnOrderService } from "./services/turn-order.service.js";
import { EnemyTurnService } from "./enemy-turn.service.js";
import { calculateMaxHP, CLASS_STATS } from "./scaling.util.js";

/**
 * CombatAppService - Combat state management for the new tactical system
 * 
 * Key changes from D&D:
 * - No attack rolls, AC, or proficiency
 * - Uses PA/PM resource system
 * - Damage calculated via scaling formula
 * - HP calculated via class-based formula
 */
@Injectable()
export class CombatAppService {
  private readonly logger = new Logger(CombatAppService.name);

  constructor(
    @InjectModel(CombatSession.name) private readonly combatSessionModel: Model<CombatSession>,
    private readonly initService: InitService,
    private readonly turnOrderService: TurnOrderService,
    private readonly actionEconomyService: ActionEconomyService,
    private readonly enemyTurnService: EnemyTurnService,
  ) {}

  /**
   * Consume PA for an action
   */
  public consumePA(state: CombatStateDto, cost: number = 1): CombatStateDto {
    return this.actionEconomyService.consumePA(state, cost);
  }

  /**
   * @deprecated Use consumePA instead
   */
  public decrementAction(state: CombatStateDto): CombatStateDto {
    return this.actionEconomyService.decrementAction(state);
  }

  /**
   * Build player combat stats using the new scaling system
   */
  private buildPlayerStats(character: CharacterResponseDto): CombatantDto {
    const className = (character.className ?? "guerrier").toLowerCase();
    const classStats = CLASS_STATS[className] ?? CLASS_STATS.guerrier;
    const level = character.level ?? 1;
    const survival = character.stats?.survival ?? 0;

    // Calculate HP using the new formula
    const hpMax = calculateMaxHP(className, level, survival);
    const hp = character.hp ?? hpMax;

    return new CombatantDto({
      id: character.characterId,
      isPlayer: true,
      name: character.name ?? "Hero",
      hp,
      hpMax,
      initiative: 0,
      // New tactical system fields
      pa: classStats.pa,
      paMax: classStats.pa,
      pm: classStats.pm,
      pmMax: classStats.pm,
      level,
      className,
      basePower: 5, // Default player base power
      scalingAttribute: classStats.main_stat,
      stats: {
        vigor: character.stats?.vigor ?? 0,
        finesse: character.stats?.finesse ?? 0,
        mind: character.stats?.mind ?? 0,
        survival: character.stats?.survival ?? 0,
      },
      side: "player",
    });
  }

  /**
   * Roll initiative (finesse-based in new system)
   */
  private rollInitiative(finesse: number = 0): number {
    const baseRoll = Math.floor(Math.random() * 20) + 1;
    return baseRoll + finesse;
  }

  /**
   * Build enemies list with stats for the new system
   */
  private buildEnemies(combatStart: CombatStartRequestDto): CombatantDto[] {
    return this.initService.buildEnemies(combatStart);
  }

  /**
   * Initialize combat state
   */
  async initializeCombat(
    character: CharacterResponseDto,
    combatStart: CombatStartRequestDto,
    userId: string,
  ): Promise<CombatStateDto> {
    const { characterId } = character;
    const state = this.buildInitialState(character, combatStart);

    await this.persistSessionWithUser(state, userId);
    this.logger.log(`Combat initialized for ${characterId} with ${state.enemies.length} enemies`);
    return state;
  }

  /**
   * Build initial combat state with the new system
   */
  private buildInitialState(
    character: CharacterResponseDto,
    combatStart: CombatStartRequestDto,
  ): CombatStateDto {
    const { characterId } = character;
    const player = this.buildPlayerStats(character);

    // Roll initiative based on finesse
    const finesse = character.stats?.finesse ?? 0;
    player.initiative = this.rollInitiative(finesse);

    const enemies = this.buildEnemies(combatStart);
    const turnOrder = this.turnOrderService.buildTurnOrder(characterId, player, enemies);

    // Use class-based PA/PM
    const className = (character.className ?? "guerrier").toLowerCase();
    const classStats = CLASS_STATS[className] ?? CLASS_STATS.guerrier;

    return new CombatStateDto({
      characterId,
      inCombat: true,
      enemies,
      player,
      turnOrder,
      currentTurnIndex: 0,
      roundNumber: 1,
    });
  }

  /**
   * Persist state with userId
   */
  private async persistSessionWithUser(state: CombatStateDto, userId: string): Promise<void> {
    await this.combatSessionModel.findOneAndUpdate(
      { characterId: state.characterId },
      { userId, ...state },
      { upsert: true, new: true },
    );
  }

  /**
   * Apply damage to player
   */
  async applyEnemyDamage(
    characterId: string,
    damageTotal: number,
  ): Promise<{
    state: CombatStateDto;
    endResult?: Pick<CombatEndDto, "xp_gained" | "enemies_defeated">;
  }> {
    const state = await this.getCombatState(characterId);
    if (!state) throw new BadRequestException("No active combat found for character.");

    state.player.hp = Math.max(0, (state.player.hp ?? 0) - Math.max(0, Math.floor(damageTotal)));
    await this.saveCombatState(state);

    if (state.player.hp <= 0) {
      state.inCombat = false;
      const endResult = await this.endCombat(characterId);
      return { state, endResult };
    }

    return { state };
  }

  /**
   * Apply healing to player
   */
  async applyPlayerHeal(characterId: string, healAmount: number): Promise<CombatStateDto> {
    const state = await this.getCombatState(characterId);
    if (!state) throw new BadRequestException("No active combat found for character.");

    const currentHp = state.player.hp ?? 0;
    const maxHp = state.player.hpMax ?? currentHp;
    state.player.hp = Math.min(currentHp + Math.max(0, Math.floor(healAmount)), maxHp);
    
    // Consume PA for healing action
    state.player.pa = Math.max(0, (state.player.pa ?? 0) - 1);
    
    await this.saveCombatState(state);
    this.logger.log(`Player healed for ${healAmount} HP, now at ${state.player.hp}/${maxHp}`);
    return state;
  }

  /**
   * Save combat state
   */
  public async saveCombatState(state: CombatStateDto): Promise<void> {
    await this.combatSessionModel.findOneAndUpdate(
      { characterId: state.characterId },
      {
        inCombat: state.inCombat,
        enemies: state.enemies,
        player: state.player,
        turnOrder: state.turnOrder,
        currentTurnIndex: state.currentTurnIndex,
        roundNumber: state.roundNumber,
        activeEffects: state.activeEffects,
      },
    );
  }

  /**
   * Get combat state
   */
  async getCombatState(characterId: string): Promise<CombatStateDto> {
    const doc = await this.combatSessionModel.findOne({ characterId }).lean().exec();
    if (!doc) throw new NotFoundException("Combat session not found");
    if (!doc.player) throw new NotFoundException("Combat session malformed: missing player");

    const enemies = Array.isArray(doc.enemies) ? doc.enemies.map(e => new CombatantDto(e)) : [];
    const player = doc.player
      ? new CombatantDto(doc.player)
      : new CombatantDto({ id: characterId, isPlayer: true });
    const turnOrder = Array.isArray(doc.turnOrder)
      ? doc.turnOrder.map(t => new CombatantDto(t))
      : [];

    return new CombatStateDto({
      characterId: doc.characterId,
      inCombat: !!doc.inCombat,
      enemies,
      player,
      turnOrder,
      currentTurnIndex: doc.currentTurnIndex ?? 0,
      roundNumber: doc.roundNumber ?? 1,
      activeEffects: doc.activeEffects ?? [],
    });
  }

  /**
   * Check if in combat
   */
  async isInCombat(characterId: string): Promise<boolean> {
    try {
      const state = await this.getCombatState(characterId);
      return !!state && state.inCombat === true;
    } catch {
      return false;
    }
  }

  /**
   * Get raw combat session
   */
  async getCombatSessionRaw(characterId: string): Promise<CombatSession | null> {
    return this.combatSessionModel.findOne({ characterId }).exec();
  }

  /**
   * Update narrative
   */
  async updateNarrative(characterId: string, narrative: string): Promise<void> {
    await this.combatSessionModel.updateOne({ characterId }, { $set: { narrative } }).exec();
  }

  /**
   * Apply player damage to enemy
   */
  async applyPlayerDamage(
    characterId: string,
    targetId: string,
    damageTotal: number,
  ): Promise<{
    state: CombatStateDto;
    endResult?: Pick<CombatEndDto, "xp_gained" | "enemies_defeated">;
  }> {
    let state = await this.getCombatState(characterId);
    if (!state) throw new BadRequestException("No active combat found for character.");

    const target = state.enemies.find(enemy => enemy.id.toLowerCase() === targetId.toLowerCase());
    if (!target) throw new BadRequestException("Target not found in combat");

    target.hp = Math.max(0, (target.hp ?? 0) - damageTotal);

    // Consume PA
    state = this.actionEconomyService.consumePA(state, 1);
    state.enemies = state.enemies.map(e => (e.id === target.id ? target : e));

    await this.saveCombatState(state);

    const anyAlive = state.enemies.some(enemy => enemy.hp > 0);
    if (!anyAlive) {
      const endResult = await this.endCombat(characterId);
      state.inCombat = false;
      return { state, endResult };
    }

    return { state };
  }

  /**
   * Get combat summary
   */
  async getCombatSummary(characterId: string): Promise<string | null> {
    const state = await this.getCombatState(characterId);
    if (!state || !state.inCombat) return null;

    const aliveEnemies = state.enemies.filter(e => e.hp > 0);
    const enemyList = aliveEnemies.map(e => `${e.name} (PV: ${e.hp}/${e.hpMax})`).join(", ");

    return (
      `Combat en cours - Round ${state.roundNumber}\n` +
      `Vos PV: ${state.player.hp}/${state.player.hpMax} | PA: ${state.player.pa}/${state.player.paMax} | PM: ${state.player.pm}/${state.player.pmMax}\n` +
      `Ennemis: ${enemyList}`
    );
  }

  /**
   * Calculate XP reward
   */
  calculateXpReward(enemies: CombatantDto[]): number {
    return enemies.reduce((total, enemy) => {
      const level = enemy.level ?? 1;
      return total + level * 50; // 50 XP per enemy level
    }, 0);
  }

  /**
   * End combat
   */
  async endCombat(
    characterId: string,
  ): Promise<Pick<CombatEndDto, "xp_gained" | "enemies_defeated">> {
    const state = await this.getCombatState(characterId);
    if (!state) throw new InternalServerErrorException("Combat session not found during cleanup");

    const defeatedEnemies = state.enemies.filter(e => (e.hp ?? 0) <= 0);
    const xpGained = this.calculateXpReward(defeatedEnemies);

    await this.combatSessionModel.deleteOne({ characterId });
    this.logger.log(`Combat cleaned up for ${characterId}`);

    return {
      xp_gained: xpGained,
      enemies_defeated: defeatedEnemies.map(e => e.name),
    };
  }

  /**
   * Process enemy turns using the new scaling system
   */
  async processEnemyTurns(
    characterId: string,
    state: CombatStateDto,
    enemies: CombatantDto[],
  ): Promise<{
    state: CombatStateDto;
    attackLogs: EnemyAttackLogDto[];
    totalDamage: number;
    playerDefeated: boolean;
  }> {
    return this.enemyTurnService.executeEnemyTurnsSequence(characterId, state, enemies);
  }
}
