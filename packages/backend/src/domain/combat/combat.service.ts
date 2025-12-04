import {
  BadRequestException,
  Injectable, Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CombatSession, CombatSessionDocument,
} from '../../infra/mongo/combat-session.schema.js';
import {
  calculateArmorClass, getDexModifier,
} from '../character/armor-class.util.js';
import type {
  CharacterResponseDto,
  InventoryItemDto, WeaponMeta,
} from '../character/dto/index.js';
import { isWeaponMeta } from '../character/dto/InventoryItemMeta.js';
import { CombatantDto } from './dto/CombatantDto.js';
import { CombatStartRequestDto } from './dto/CombatStartRequestDto.js';
import { CombatStateDto } from './dto/CombatStateDto.js';
import { InitService } from './services/init.service.js';
import { TurnOrderService } from './services/turn-order.service.js';
import { ActionEconomyService } from './services/action-economy.service.js';

/**
 * Service managing combat state and mechanics.
 * Simplified to expose only methods consumed by the orchestrator.
 */
@Injectable()
export class CombatService {
  private readonly logger = new Logger(CombatService.name);

  constructor(
    @InjectModel(CombatSession.name) private combatSessionModel: Model<CombatSessionDocument>,
    private readonly initService: InitService,
    private readonly turnOrderService: TurnOrderService,
    private readonly actionEconomyService: ActionEconomyService,
  ) {}

  /**
   * Get ability modifier for attack calculations
   */
  private getStrModifier(character: CharacterResponseDto): number {
    const strScore = character.scores?.Str ?? 10;
    return Math.floor((strScore - 10) / 2);
  }

  /**
   * Calculate attack bonus based on character stats
   */
  private calculatePlayerAttackBonus(character: CharacterResponseDto): number {
    const strMod = this.getStrModifier(character);
    const proficiency = character.proficiency ?? 2;
    return strMod + proficiency;
  }

  /**
   * Calculate damage bonus (STR modifier by default)
   */
  private calculatePlayerDamageBonus(character: CharacterResponseDto): number {
    return this.getStrModifier(character);
  }

  /**
   * Get the player's main weapon damage dice
   */
  private getPlayerDamageDice(character: CharacterResponseDto): string {
    // Prefer equipped item with a definitionId and lookup its definition for damage
    const equipped = character.inventory?.find(i => i.equipped && i.definitionId);
    if (equipped?.meta && isWeaponMeta(equipped.meta)) {
      return equipped.meta.damage || '1d6';
    }
    return '1d6';
  }

  /**
   * Build base player combat stats
   */
  private buildBasePlayerStats(character: CharacterResponseDto): CombatantDto {
    return new CombatantDto({
      id: character.characterId,
      isPlayer: true,
      name: character.name ?? 'Hero',
      hp: character.hp ?? character.hpMax ?? 10,
      hpMax: character.hpMax ?? 10,
      ac: calculateArmorClass(character),
      initiative: 0,
      attackBonus: this.calculatePlayerAttackBonus(character),
      damageDice: this.getPlayerDamageDice(character),
      damageBonus: this.calculatePlayerDamageBonus(character),
    });
  }

  /**
   * Find equipped weapon from inventory
   */
  private findEquippedWeapon(inventory: InventoryItemDto[]) {
    const equipped = inventory.find(i => i?.equipped && i.meta && (i.meta as { type?: string }).type === 'weapon');
    if (equipped) return equipped;

    return inventory.find(i => i?.equipped && typeof i.definitionId === 'string' && i.definitionId.startsWith('weapon-'));
  }

  /**
   * Check if weapon uses DEX for attack/damage
   */
  private weaponUsesDex(meta: WeaponMeta): boolean {
    const properties: string[] = Array.isArray(meta.properties) ? meta.properties : [];
    const lowerProps = properties.map(p => (p || '').toLowerCase());
    const classStr = (meta.class || '').toString()
      .toLowerCase();
    const hasAmmunition = lowerProps.some(p => p.includes('ammunition'));
    const hasFinesse = lowerProps.includes('finesse');
    const isRangedClass = classStr.includes('ranged');
    return hasFinesse || hasAmmunition || isRangedClass;
  }

  /**
   * Extract damage dice from weapon meta
   */
  private extractDamageDice(meta: WeaponMeta): string | undefined {
    if (meta.damage && typeof meta.damage === 'string') {
      const parts = meta.damage.trim()
        .split(/\s+/);
      if (parts.length > 0 && /^\d+d\d+/i.test(parts[0])) {
        return parts[0];
      }
    }
    return undefined;
  }

  /**
   * Update player stats based on equipped weapon
   */
  private updatePlayerWeaponStats(player: CombatantDto, character: CharacterResponseDto): void {
    if (!character.inventory) return;
    const equipped = this.findEquippedWeapon(character.inventory);
    if (!equipped) return;
    const { meta } = equipped;
    if (!isWeaponMeta(meta)) return;
    const damageDice = this.extractDamageDice(meta);
    if (damageDice) player.damageDice = damageDice;

    const usesDex = this.weaponUsesDex(meta);
    const abilityMod = usesDex ? getDexModifier(character) : this.getStrModifier(character);
    const proficiency = character.proficiency ?? 2;
    player.attackBonus = abilityMod + proficiency;
    player.damageBonus = abilityMod;
  }

  /**
   * Local d20 roll for initiatives.
   * CombatService must not call other domain services.
   */
  private rollD20(): number {
    return Math.floor(Math.random() * 20) + 1;
  }

  /**
   * Build enemies list with rolled initiatives (no external services)
   */
  private buildEnemies(combatStart: CombatStartRequestDto) {
    // move to InitService
    return this.initService.buildEnemies(combatStart);
  }

  /**
   * Initialize combat state from combat_start instruction (no initial activations)
   */
  async initializeCombat(
    character: CharacterResponseDto,
    combatStart: CombatStartRequestDto,
    userId: string,
  ): Promise<CombatStateDto> {
    const { characterId } = character;
    const state = this.buildInitialState(character, combatStart);

    // Persist initial state (do NOT perform dice/attack resolution here)
    await this.persistSessionWithUser(state, userId);
    this.logger.log(`Combat initialized for ${characterId} with ${state.enemies.length} enemies`);
    return state;
  }

  /**
   * Build initial combat state.
   */
  private buildInitialState(character: CharacterResponseDto, combatStart: CombatStartRequestDto): CombatStateDto {
    const { characterId } = character;
    const player = this.buildBasePlayerStats(character);

    // Roll player initiative
    const playerInitRoll = this.rollD20();
    player.initiative = playerInitRoll + getDexModifier(character);

    // Update player stats based on equipped weapon
    try {
      this.updatePlayerWeaponStats(player, character);
    } catch (err) {
      this.logger.warn(`Failed to derive weapon stats from inventory: ${err}`);
    }

    const enemies = this.buildEnemies(combatStart);
    const turnOrder = this.turnOrderService.buildTurnOrder(characterId, player, enemies);

    const actionMax = 1;
    const bonusActionMax = 1;

    return new CombatStateDto({
      characterId,
      inCombat: true,
      enemies,
      player,
      turnOrder,
      currentTurnIndex: 0,
      roundNumber: 1,
      phase: 'PLAYER_TURN',
      actionRemaining: actionMax,
      actionMax,
      bonusActionRemaining: bonusActionMax,
      bonusActionMax,
    });
  }

  /**
   * Persist state and attach userId (used during initialization)
   */
  private async persistSessionWithUser(state: CombatStateDto, userId: string): Promise<void> {
    await this.combatSessionModel.findOneAndUpdate(
      { characterId: state.characterId },
      {
        userId,
        ...state,
      },
      {
        upsert: true,
        new: true,
      },
    );
  }

  /**
   * Apply damage from an enemy to the player and persist state.
   * This method deliberately does not roll dice and does not handle attack logic.
   */
  async applyEnemyDamage(characterId: string, damageTotal: number): Promise<CombatStateDto> {
    const state = await this.getCombatState(characterId);
    if (!state) throw new BadRequestException('No active combat found for character.');

    // Reduce player HP
    state.player.hp = Math.max(0, (state.player.hp ?? 0) - Math.max(0, Math.floor(damageTotal)));

    // Persist state
    await this.saveCombatState(state);

    // If player dies, finalize combat cleanup
    if (state.player.hp <= 0) {
      state.inCombat = false;
      await this.endCombat(characterId);
      return state;
    }

    return state;
  }

  /**
   * Save combat state to database
   */
  public async saveCombatState(state: CombatStateDto): Promise<void> {
    await this.combatSessionModel.findOneAndUpdate(
      { characterId: state.characterId },
      {
        inCombat: state.inCombat,
        enemies: state.enemies, // unified CombatantDto[]
        player: state.player,
        turnOrder: state.turnOrder,
        currentTurnIndex: state.currentTurnIndex,
        roundNumber: state.roundNumber,
        phase: state.phase,
        actionRemaining: state.actionRemaining,
        actionMax: state.actionMax,
        bonusActionRemaining: state.bonusActionRemaining,
        bonusActionMax: state.bonusActionMax,
      },
    );
  }

  /**
   * Retrieve the current combat state from the database
   */
  async getCombatState(characterId: string): Promise<CombatStateDto> {
    const doc = await this.combatSessionModel.findOne({ characterId })
      .lean()
      .exec();
    if (!doc) throw new NotFoundException('Combat session not found');
    if (!doc.player) throw new NotFoundException('Combat session malformed: missing player');
    // Convert raw DB objects into class instances for consistent runtime behavior
    const enemies = Array.isArray(doc.enemies) ? doc.enemies.map(e => new CombatantDto(e)) : [];
    const player = doc.player
      ? new CombatantDto(doc.player)
      : new CombatantDto({
          id: characterId,
          isPlayer: true,
        });
    const turnOrder = Array.isArray(doc.turnOrder) ? doc.turnOrder.map(t => new CombatantDto(t)) : [];

    return new CombatStateDto({
      characterId: doc.characterId,
      inCombat: !!doc.inCombat,
      enemies,
      player,
      turnOrder,
      currentTurnIndex: doc.currentTurnIndex ?? 0,
      roundNumber: doc.roundNumber ?? 1,
      phase: (doc.phase as CombatStateDto['phase']) ?? 'PLAYER_TURN',
      actionRemaining: doc.actionRemaining ?? 1,
      actionMax: doc.actionMax ?? 1,
      bonusActionRemaining: doc.bonusActionRemaining ?? 1,
      bonusActionMax: doc.bonusActionMax ?? 1,
    });
  }

  /**
   * Quick check whether a character currently has an active combat
   */
  async isInCombat(characterId: string): Promise<boolean> {
    const state = await this.getCombatState(characterId);
    return !!state && state.inCombat === true;
  }

  /**
   * Apply damage reported by client to a named enemy and persist state.
   * Decrements action counter.
   */
  async applyPlayerDamage(characterId: string, targetId: string, damageTotal: number): Promise<CombatStateDto> {
    const state = await this.getCombatState(characterId);
    if (!state) throw new BadRequestException('No active combat found for character.');

    const target = state.enemies.find(enemy => enemy.id.toLowerCase() === targetId.toLowerCase());
    if (!target) throw new BadRequestException('Target not found in combat');

    target.hp = Math.max(0, (target.hp ?? 0) - damageTotal);
    await this.saveCombatState(state);

    // Consume a player action
    this.actionEconomyService.decrementAction(state);

    // Finalize combat if needed (all enemies dead)
    const anyAlive = state.enemies.some(enemy => enemy.hp > 0);
    if (!anyAlive) {
      // persist and cleanup
      await this.endCombat(characterId);
      return this.getCombatState(characterId);
    }

    return state;
  }

  /**
   * Get list of valid targets for player
   */
  async getValidTargets(characterId: string): Promise<string[]> {
    const state = await this.getCombatState(characterId);
    if (!state || !state.inCombat) {
      return [];
    }

    return state.enemies.filter(e => e.hp > 0)
      .map(e => e.id);
  }

  /**
   * Get combat status summary
   */
  async getCombatSummary(characterId: string): Promise<string | null> {
    const state = await this.getCombatState(characterId);
    if (!state || !state.inCombat) {
      return null;
    }

    const aliveEnemies = state.enemies.filter(e => e.hp > 0);
    const enemyList = aliveEnemies.map(e => `${e.name} (PV: ${e.hp}/${e.hpMax})`)
      .join(', ');

    return `Combat en cours - Round ${state.roundNumber}\n`
      + `Vos PV: ${state.player.hp}/${state.player.hpMax}\n`
      + `Ennemis: ${enemyList}\n`
      + `Utilisez /attack [nom_ennemi] pour attaquer.`;
  }

  /**
   * Calculate XP reward for defeated enemies
   */
  calculateXpReward(enemies: CombatantDto[]): number {
    return enemies.reduce((total, enemy) => total + (enemy.hpMax ?? 0) * 10, 0);
  }

  /**
   * End combat and generate final result (cleanup)
   */
  async endCombat(characterId: string): Promise<{
    xpGained: number;
    enemiesDefeated: string[];
  } | null> {
    const state = await this.getCombatState(characterId);
    if (!state) {
      return null;
    }

    // Enemies with hp <= 0 are defeated
    const defeatedEnemies = state.enemies.filter(e => (e.hp ?? 0) <= 0);
    const xpGained = this.calculateXpReward(defeatedEnemies);

    await this.combatSessionModel.deleteOne({ characterId });
    this.logger.log(`Combat cleaned up for ${characterId}`);

    return {
      xpGained,
      enemiesDefeated: defeatedEnemies.map(e => e.name),
    };
  }
}
