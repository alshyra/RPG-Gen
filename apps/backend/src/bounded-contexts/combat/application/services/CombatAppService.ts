import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import { CombatSession } from "../../infrastructure/persistence/mongo/schemas/CombatSession.js";
import type { CharacterResponseDto } from "../../../character/api/dto/response/index.js";
import { type StatAttribute } from "../../../character/api/dto/response/StatAttribute.js";
import { CombatantDto } from "../../api/dto/response/CombatantDto.js";
import { CombatEndDto } from "../../api/dto/response/CombatEndDto.js";
import { CombatStartRequestDto } from "../../api/dto/response/CombatStartRequestDto.js";
import { CombatStateDto } from "../../api/dto/response/CombatStateDto.js";
import { EnemyAttackLogDto } from "../../api/dto/response/EnemyAttackLogDto.js";
import { ActionEconomyService } from "../../domain/services/action-economy.service.js";
import { InitService } from "../../domain/services/init.service.js";
import { TurnOrderService } from "../../domain/services/turn-order.service.js";
import { EnemyTurnService } from "../../domain/services/enemy-turn.service.js";
import { CombatGridService } from "../../domain/services/combat-grid.service.js";
import { type ClassStatsInput } from "../../domain/scaling.util.js";
import { ClassDataService } from "../../../game-data/application/services/ClassDataService.js";
import { FormulasService } from "../../../game-data/application/services/FormulasService.js";

const VALID_STAT_ATTRIBUTES: StatAttribute[] = ["vigor", "finesse", "mind", "survival"];

function isStatAttribute(value: string): value is StatAttribute {
  return VALID_STAT_ATTRIBUTES.includes(value as StatAttribute);
}

// Grid constants
const GRID_WIDTH = 15;
const GRID_HEIGHT = 10;

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
    private readonly gridService: CombatGridService,
    private readonly classDataService: ClassDataService,
    private readonly formulasService: FormulasService,
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
  private async buildPlayerStats(character: CharacterResponseDto): Promise<CombatantDto> {
    const className = (character.className ?? "guerrier").toLowerCase();
    const classDefinition = await this.classDataService.findByName(className);
    
    // Get class stats from game-data, fallback to guerrier
    const classStats: ClassStatsInput = classDefinition?.stats ?? {
      hpBase: 12,
      hpGain: 8,
      pa: 6,
      pm: 4,
    };
    const mainStatRaw = classDefinition?.mainStat ?? "vigor";
    const mainStat: StatAttribute = isStatAttribute(mainStatRaw) ? mainStatRaw : "vigor";
    
    const level = character.level ?? 1;
    const survival = character.stats?.survival ?? 0;

    // Calculate HP using FormulasService (data from seed)
    const hpMax = this.formulasService.calculateMaxHP(
      classStats.hpBase,
      classStats.hpGain,
      level,
      survival,
    );
    const hp = character.hp ?? hpMax;

    // Use character's PA/PM if available, fallback to class defaults
    const pa = character.pa ?? classStats.pa;
    const paMax = character.paMax ?? classStats.pa;
    const pm = character.pm ?? classStats.pm;
    const pmMax = character.pmMax ?? classStats.pm;

    return new CombatantDto({
      id: character.characterId,
      isPlayer: true,
      name: character.name ?? "Hero",
      hp,
      hpMax,
      initiative: 0,
      // New tactical system fields - use character values as source of truth
      pa,
      paMax,
      pm,
      pmMax,
      position: { x: 1, y: 5 },  // Player starts on left side
      level,
      className,
      basePower: 5, // Default player base power
      scalingAttribute: mainStat,
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
   * Uses FormulasService for the die roll configuration.
   */
  private rollInitiative(finesse: number = 0): number {
    return this.formulasService.rollInitiative(finesse);
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
    const state = await this.buildInitialState(character, combatStart);

    // Initialize the combat grid with positions
    this.initializeGridForCombat(characterId, state);

    await this.persistSessionWithUser(state, userId);
    this.logger.log(`Combat initialized for ${characterId} with ${state.enemies.length} enemies`);
    return state;
  }

  /**
   * Initialize the combat grid with player and enemy positions
   */
  private initializeGridForCombat(characterId: string, state: CombatStateDto): void {
    const combatants: Array<{
      id: string;
      position: { x: number; y: number };
      reach?: number;
      speed?: number;
      isHostile: boolean;
    }> = [];

    // Add player at left side of grid
    const playerPosition = { x: 2, y: Math.floor(GRID_HEIGHT / 2) };
    state.player.position = playerPosition;
    combatants.push({
      id: state.player.id || characterId,
      position: playerPosition,
      speed: state.player.pm ?? 6, // Default PM as speed
      reach: 1,
      isHostile: false,
    });

    // Add enemies spread across the right side of the grid
    state.enemies.forEach((enemy, index) => {
      const enemyPosition = {
        x: GRID_WIDTH - 3,
        y: Math.max(1, Math.min(GRID_HEIGHT - 2, Math.floor(GRID_HEIGHT / 2) - Math.floor(state.enemies.length / 2) + index)),
      };
      enemy.position = enemyPosition;
      combatants.push({
        id: enemy.id,
        position: enemyPosition,
        speed: enemy.pm ?? 4, // Default enemy PM
        reach: 1,
        isHostile: true,
      });
    });

    // Update turnOrder positions as well
    state.turnOrder.forEach(combatant => {
      if (combatant.isPlayer) {
        combatant.position = state.player.position;
      } else {
        const enemy = state.enemies.find(e => e.id === combatant.id);
        if (enemy) {
          combatant.position = enemy.position;
        }
      }
    });

    this.gridService.initializeGrid(characterId, GRID_WIDTH, GRID_HEIGHT, combatants);
    this.logger.debug(`Grid initialized for combat ${characterId}: ${combatants.length} combatants`);
  }

  /**
   * Build initial combat state with the new system
   */
  private async buildInitialState(
    character: CharacterResponseDto,
    combatStart: CombatStartRequestDto,
  ): Promise<CombatStateDto> {
    const { characterId } = character;
    const player = await this.buildPlayerStats(character);

    // Roll initiative based on finesse
    const finesse = character.stats?.finesse ?? 0;
    player.initiative = this.rollInitiative(finesse);

    const enemies = this.buildEnemies(combatStart);
    const turnOrder = this.turnOrderService.buildTurnOrder(characterId, player, enemies);

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

    const state = new CombatStateDto({
      characterId: doc.characterId,
      inCombat: !!doc.inCombat,
      enemies,
      player,
      turnOrder,
      currentTurnIndex: doc.currentTurnIndex ?? 0,
      roundNumber: doc.roundNumber ?? 1,
      activeEffects: doc.activeEffects ?? [],
    });

    // Ensure grid is initialized (may be lost after server restart)
    this.ensureGridInitialized(characterId, state);

    return state;
  }

  /**
   * Ensure the combat grid is initialized from persisted state
   * Called when loading combat state to handle server restarts
   */
  private ensureGridInitialized(characterId: string, state: CombatStateDto): void {
    // Check if grid already exists
    const existingPositions = this.gridService.getAllPositions(characterId);
    if (existingPositions.length > 0) {
      return; // Grid already initialized
    }

    // Rebuild grid from persisted positions
    const combatants: Array<{
      id: string;
      position: { x: number; y: number };
      reach?: number;
      speed?: number;
      isHostile: boolean;
    }> = [];

    // Add player
    const playerPos = state.player.position ?? { x: 2, y: Math.floor(GRID_HEIGHT / 2) };
    combatants.push({
      id: state.player.id || characterId,
      position: playerPos,
      speed: state.player.pm ?? 6,
      reach: 1,
      isHostile: false,
    });

    // Add enemies
    state.enemies.forEach((enemy, index) => {
      const enemyPos = enemy.position ?? {
        x: GRID_WIDTH - 3,
        y: Math.max(1, Math.min(GRID_HEIGHT - 2, Math.floor(GRID_HEIGHT / 2) - Math.floor(state.enemies.length / 2) + index)),
      };
      combatants.push({
        id: enemy.id,
        position: enemyPos,
        speed: enemy.pm ?? 4,
        reach: 1,
        isHostile: true,
      });
    });

    this.gridService.initializeGrid(characterId, GRID_WIDTH, GRID_HEIGHT, combatants);
    this.logger.debug(`Grid re-initialized for combat ${characterId} from persisted state`);
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
