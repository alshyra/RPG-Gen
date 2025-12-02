import {
  Injectable, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { CharacterResponseDto } from '../character/dto/index.js';
import { ItemDefinitionService } from '../item-definition/item-definition.service.js';
import { DiceService } from '../dice/dice.service.js';
import {
  calculateArmorClass, getDexModifier,
} from '../character/armor-class.util.js';
import {
  CombatSession, CombatSessionDocument,
} from '../../infra/mongo/combat-session.schema.js';
import { CombatStateDto } from './dto/CombatStateDto.js';
import { CombatPlayerDto } from './dto/CombatPlayerDto.js';
import { CombatStartRequestDto } from './dto/CombatStartRequestDto.js';
import { CombatEnemyDto } from './dto/CombatEnemyDto.js';
import { CombatantDto } from './dto/CombatantDto.js';
import { AttackResultDto } from './dto/AttackResultDto.js';
import { TurnResultDto } from './dto/TurnResultDto.js';
import { TurnResultWithInstructionsDto } from './dto/TurnResultWithInstructionsDto.js';
import type { XpInstructionMessageDto } from '../chat/dto/index.js';

interface WeaponMeta {
  damage?: string;
  class?: string;
  properties?: string[];
}

interface EquippedItem {
  equipped?: boolean;
  definitionId?: string;
  meta?: WeaponMeta;
}

/**
 * Service managing combat state and mechanics.
 * Combat state is persisted to MongoDB for durability across restarts.
 */
@Injectable()
export class CombatService {
  private readonly logger = new Logger(CombatService.name);

  constructor(
    @InjectModel(CombatSession.name) private combatSessionModel: Model<CombatSessionDocument>,
    private itemDefinitionService: ItemDefinitionService,
    private diceService: DiceService,
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
    if (equipped && equipped.definitionId) {
      try {
        return '1d4';
      } catch {
        return '1d4';
      }
    }
    return '1d4';
  }

  /**
   * Build base player combat stats
   */
  private buildBasePlayerStats(character: CharacterResponseDto): CombatPlayerDto {
    return {
      characterId: character.characterId,
      name: character.name ?? 'Hero',
      hp: character.hp ?? character.hpMax ?? 10,
      hpMax: character.hpMax ?? 10,
      ac: calculateArmorClass(character),
      initiative: 0,
      attackBonus: this.calculatePlayerAttackBonus(character),
      damageDice: this.getPlayerDamageDice(character),
      damageBonus: this.calculatePlayerDamageBonus(character),
    };
  }

  /**
   * Find equipped weapon from inventory
   */
  private findEquippedWeapon(inventory: EquippedItem[]): EquippedItem | undefined {
    let equipped = inventory.find(i => i?.equipped && i.meta && (i.meta as { type?: string }).type === 'weapon');
    if (!equipped) {
      equipped = inventory.find(i => i?.equipped && typeof i.definitionId === 'string' && i.definitionId.startsWith('weapon-'));
    }
    return equipped || inventory.find(i => i?.equipped);
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
  private updatePlayerWeaponStats(player: CombatPlayerDto, character: CharacterResponseDto): void {
    const inventory = (character.inventory || []) as EquippedItem[];
    const equipped = this.findEquippedWeapon(inventory);
    if (!equipped) return;

    const meta: WeaponMeta = equipped.meta || {};
    const damageDice = this.extractDamageDice(meta);
    if (damageDice) player.damageDice = damageDice;

    const usesDex = this.weaponUsesDex(meta);
    const abilityMod = usesDex ? getDexModifier(character) : this.getStrModifier(character);
    const proficiency = character.proficiency ?? 2;
    player.attackBonus = abilityMod + proficiency;
    player.damageBonus = abilityMod;
  }

  /**
   * Build enemy list with rolled initiatives
   */
  private buildEnemies(combatStart: CombatStartRequestDto): CombatEnemyDto[] {
    return combatStart.combat_start.map((enemy, idx) => {
      const initRoll = this.diceService.rollDiceExpr('1d20');
      return {
        id: `enemy-${idx + 1}`,
        name: enemy.name,
        hp: enemy.hp,
        hpMax: enemy.hp,
        ac: enemy.ac,
        initiative: initRoll.total,
        attackBonus: enemy.attack_bonus ?? 3,
        damageDice: enemy.damage_dice ?? '1d6',
        damageBonus: enemy.damage_bonus ?? 1,
      };
    });
  }

  /**
   * Build sorted turn order from player and enemies.
   * Player is duplicated N times (N = number of alive enemies) to allow
   * alternating activations following D&D style initiative.
   */
  private buildTurnOrder(characterId: string, player: CombatPlayerDto, enemies: CombatEnemyDto[]): CombatantDto[] {
    const aliveEnemies = enemies.filter(e => e.hp > 0);
    const numPlayerActivations = Math.max(1, aliveEnemies.length);

    // Create enemy entries
    const enemyEntries: CombatantDto[] = enemies.map(e => ({
      id: e.id,
      name: e.name,
      initiative: e.initiative,
      isPlayer: false,
    }));

    // Create duplicated player entries
    const playerEntries: CombatantDto[] = Array.from({ length: numPlayerActivations }, (_, idx) => ({
      id: `${characterId}#${idx}`,
      name: player.name,
      initiative: player.initiative,
      isPlayer: true,
      originId: characterId,
      activationIndex: idx,
    }));

    // Combine and sort by initiative (descending)
    const allCombatants = [
      ...enemyEntries,
      ...playerEntries,
    ];

    // Sort by initiative desc, then by isPlayer (enemies first on tie for fairness)
    return allCombatants.sort((a, b) => {
      if (b.initiative !== a.initiative) return b.initiative - a.initiative;
      // On tie, enemies act before player
      return a.isPlayer ? 1 : -1;
    });
  }

  /**
   * Rebuild turn order after enemy death, maintaining player duplications = alive enemies
   */
  private rebuildTurnOrderAfterDeath(state: CombatStateDto): void {
    const aliveEnemies = state.enemies.filter(e => e.hp > 0);
    if (aliveEnemies.length === 0) return;

    // Get current combatant before rebuild
    const currentCombatant = state.turnOrder[state.currentTurnIndex];

    // Rebuild turn order
    state.turnOrder = this.buildTurnOrder(
      state.characterId,
      state.player,
      state.enemies,
    );

    // Try to find same combatant in new order
    if (currentCombatant) {
      const newIndex = state.turnOrder.findIndex(c => c.id === currentCombatant.id);
      state.currentTurnIndex = newIndex >= 0 ? newIndex : 0;
    } else {
      state.currentTurnIndex = 0;
    }
  }

  /**
   * Initialize combat state from combat_start instruction
   */
  async initializeCombat(
    character: CharacterResponseDto,
    combatStart: CombatStartRequestDto,
    userId: string,
  ): Promise<CombatStateDto> {
    const { characterId } = character;
    const player = this.buildBasePlayerStats(character);

    // Roll player initiative
    const playerInitRoll = this.diceService.rollDiceExpr('1d20');
    player.initiative = playerInitRoll.total + getDexModifier(character);

    // Update player stats based on equipped weapon
    try {
      this.updatePlayerWeaponStats(player, character);
    } catch (err) {
      this.logger.warn(`Failed to derive weapon stats from inventory: ${err}`);
    }

    const enemies = this.buildEnemies(combatStart);
    const turnOrder = this.buildTurnOrder(characterId, player, enemies);

    // D&D 5e default action economy: 1 action + 1 bonus action per activation
    const actionMax = 1;
    const bonusActionMax = 1;

    const state: CombatStateDto = {
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
    };

    await this.combatSessionModel.findOneAndUpdate(
      { characterId },
      {
        userId,
        ...state,
      },
      {
        upsert: true,
        new: true,
      },
    );

    this.logger.log(`Combat initialized for ${characterId} with ${enemies.length} enemies`);
    return state;
  }

  // eslint-disable-next-line max-statements
  private performAttack(
    attacker: {
      name: string;
      attackBonus: number;
      damageDice: string;
      damageBonus: number;
    },
    target: {
      name: string;
      ac: number;
      hp: number;
    },
    _isPlayerAttack: boolean,
  ): AttackResultDto {
    // Roll attack
    const attackRoll = this.diceService.rollDiceExpr('1d20');
    const [dieRoll] = attackRoll.rolls;
    const totalAttack = dieRoll + attacker.attackBonus;

    const critical = dieRoll === 20;
    const fumble = dieRoll === 1;
    const hit = (critical || (totalAttack >= target.ac && !fumble));

    let damageRoll: number[] = [];
    let totalDamage = 0;

    if (hit) {
      // Roll damage
      const damageResult = this.diceService.rollDiceExpr(attacker.damageDice);
      damageRoll = damageResult.rolls;

      // Critical hit doubles dice damage
      let diceTotal = damageRoll.reduce((sum, d) => sum + d, 0);
      if (critical) {
        diceTotal *= 2;
      }

      totalDamage = diceTotal + attacker.damageBonus;
      if (totalDamage < 0) totalDamage = 0;
    }

    const targetHpAfter = Math.max(0, target.hp - totalDamage);

    return {
      attacker: attacker.name,
      target: target.name,
      attackRoll: dieRoll,
      attackBonus: attacker.attackBonus,
      totalAttack,
      targetAc: target.ac,
      hit,
      critical,
      fumble,
      damageRoll,
      damageBonus: attacker.damageBonus,
      totalDamage,
      targetHpBefore: target.hp,
      targetHpAfter,
      targetDefeated: targetHpAfter <= 0,
    };
  }

  /**
   * Generate narrative text for an attack result
   */
  private generateAttackNarrative(result: AttackResultDto, isPlayerAttack: boolean): string {
    if (result.fumble) {
      return isPlayerAttack
        ? `Vous tentez de frapper ${result.target} mais votre attaque échoue lamentablement (1 naturel).`
        : `${result.attacker} tente de vous frapper mais rate complètement son attaque (1 naturel).`;
    }

    if (!result.hit) {
      return isPlayerAttack
        ? `Vous attaquez ${result.target} (${result.totalAttack} vs CA ${result.targetAc}) mais votre coup ne passe pas.`
        : `${result.attacker} vous attaque (${result.totalAttack} vs CA ${result.targetAc}) mais rate son coup.`;
    }

    const critText = result.critical ? ' (Coup critique!)' : '';

    if (result.targetDefeated) {
      return isPlayerAttack
        ? `Votre attaque touche ${result.target}${critText}! Vous infligez ${result.totalDamage} points de dégâts et le terrassez!`
        : `${result.attacker} vous frappe${critText} et inflige ${result.totalDamage} points de dégâts. Vous tombez inconscient!`;
    }

    return isPlayerAttack
      ? `Votre attaque touche ${result.target}${critText}! Vous infligez ${result.totalDamage} points de dégâts (PV: ${result.targetHpAfter}/${result.targetHpBefore + result.totalDamage}).`
      : `${result.attacker} vous frappe${critText} et inflige ${result.totalDamage} points de dégâts. Vous êtes à ${result.targetHpAfter} PV.`;
  }

  /**
   * Process player attack command
   */
  async processPlayerAttack(characterId: string, targetName: string): Promise<TurnResultDto | null> {
    const state = await this.getCombatState(characterId);
    if (!state || !state.inCombat) {
      return null;
    }

    // Find target enemy
    const targetEnemy = state.enemies.find(
      e => e.name.toLowerCase() === targetName.toLowerCase() && e.hp > 0,
    );

    if (!targetEnemy) {
      // If no exact match, try partial match
      const partialMatch = state.enemies.find(
        e => e.name.toLowerCase()
          .includes(targetName.toLowerCase()) && e.hp > 0,
      );
      if (!partialMatch) {
        return null;
      }
      return this.executeTurn(state, partialMatch);
    }

    return this.executeTurn(state, targetEnemy);
  }

  /**
   * Execute a full combat turn
   */
  // eslint-disable-next-line max-statements
  private async executeTurn(state: CombatStateDto, targetEnemy: CombatEnemyDto): Promise<TurnResultDto> {
    const playerAttacks: AttackResultDto[] = [];
    const enemyAttacks: AttackResultDto[] = [];
    const narrativeParts: string[] = [];

    const { turnOrder } = state;
    const totalCombatants = turnOrder.length;

    // Process each combatant in initiative order starting from currentTurnIndex
    // Build ordered combatant list starting from currentTurnIndex
    const orderedCombatants = Array.from({ length: totalCombatants })
      .map((_, offset) => turnOrder[(state.currentTurnIndex + offset) % totalCombatants]);

    let finalResult: TurnResultDto | null = null;

    // eslint-disable-next-line max-statements
    orderedCombatants.some((combatant) => {
      if (!state.inCombat) return true;

      if (combatant.isPlayer) {
        const currentTarget = state.enemies.find(e => e.name.toLowerCase() === targetEnemy.name.toLowerCase());
        if (currentTarget && currentTarget.hp > 0) {
          const playerAttack = this.performAttack(
            {
              name: state.player.name,
              attackBonus: state.player.attackBonus,
              damageDice: state.player.damageDice,
              damageBonus: state.player.damageBonus,
            },
            {
              name: currentTarget.name,
              ac: currentTarget.ac,
              hp: currentTarget.hp,
            },
            true,
          );

          currentTarget.hp = playerAttack.targetHpAfter;
          playerAttacks.push(playerAttack);
          narrativeParts.push(this.generateAttackNarrative(playerAttack, true));

          const aliveEnemies = state.enemies.filter(e => e.hp > 0);
          if (aliveEnemies.length === 0) {
            state.inCombat = false;
            finalResult = {
              turnNumber: state.currentTurnIndex,
              roundNumber: state.roundNumber,
              playerAttacks,
              enemyAttacks,
              combatEnded: true,
              victory: true,
              defeat: false,
              remainingEnemies: [],
              playerHp: state.player.hp,
              playerHpMax: state.player.hpMax,
              narrative: narrativeParts.join('\n\n') + '\n\nVictoire! Tous les ennemis ont été vaincus!',
            };
            this.logger.log(`Combat ended for ${state.characterId}: Victory`);
            return true;
          }
        }
        return false;
      }

      const enemy = state.enemies.find(e => e.id === combatant.id && e.hp > 0);
      if (enemy) {
        const enemyAttack = this.performAttack(
          {
            name: enemy.name,
            attackBonus: enemy.attackBonus,
            damageDice: enemy.damageDice,
            damageBonus: enemy.damageBonus,
          },
          {
            name: state.player.name,
            ac: state.player.ac,
            hp: state.player.hp,
          },
          false,
        );

        state.player.hp = enemyAttack.targetHpAfter;
        enemyAttacks.push(enemyAttack);
        narrativeParts.push(this.generateAttackNarrative(enemyAttack, false));

        if (state.player.hp <= 0) {
          state.inCombat = false;
          finalResult = {
            turnNumber: state.currentTurnIndex,
            roundNumber: state.roundNumber,
            playerAttacks,
            enemyAttacks,
            combatEnded: true,
            victory: false,
            defeat: true,
            remainingEnemies: state.enemies.filter(e => e.hp > 0),
            playerHp: 0,
            playerHpMax: state.player.hpMax,
            narrative: narrativeParts.join('\n\n') + '\n\nDéfaite... Vous tombez inconscient.',
          };
          this.logger.log(`Combat ended for ${state.characterId}: Defeat`);
          return true;
        }
      }

      return false;
    });

    if (finalResult) {
      await this.saveCombatState(state);
      return finalResult;
    }

    // Advance current turn index to next combatant for subsequent turns
    state.currentTurnIndex = (state.currentTurnIndex + 1) % totalCombatants;
    // Increment round number after a full pass
    state.roundNumber++;

    // Persist updated state
    await this.saveCombatState(state);

    const aliveEnemies = state.enemies.filter(e => e.hp > 0);
    const turnResult: TurnResultDto = {
      turnNumber: state.currentTurnIndex,
      roundNumber: state.roundNumber,
      playerAttacks,
      enemyAttacks,
      combatEnded: false,
      victory: false,
      defeat: false,
      remainingEnemies: aliveEnemies,
      playerHp: state.player.hp,
      playerHpMax: state.player.hpMax,
      narrative: narrativeParts.join('\n\n') + '\n\nUtilisez /attack [nom_ennemi] pour continuer le combat.',
    };

    return turnResult;
  }

  /**
   * Save combat state to database
   */
  private async saveCombatState(state: CombatStateDto): Promise<void> {
    await this.combatSessionModel.findOneAndUpdate(
      { characterId: state.characterId },
      {
        inCombat: state.inCombat,
        enemies: state.enemies,
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
  async getCombatState(characterId: string): Promise<CombatStateDto | null> {
    const doc = await this.combatSessionModel.findOne({ characterId })
      .lean()
      .exec();
    if (!doc) return null;

    const state: CombatStateDto = {
      characterId: doc.characterId,
      inCombat: !!doc.inCombat,
      enemies: (doc.enemies as CombatEnemyDto[]) ?? [],
      player: doc.player as CombatPlayerDto,
      turnOrder: (doc.turnOrder as CombatantDto[]) ?? [],
      currentTurnIndex: doc.currentTurnIndex ?? 0,
      roundNumber: doc.roundNumber ?? 1,
      phase: (doc.phase as CombatStateDto['phase']) ?? 'PLAYER_TURN',
      actionRemaining: doc.actionRemaining ?? 1,
      actionMax: doc.actionMax ?? 1,
      bonusActionRemaining: doc.bonusActionRemaining ?? 1,
      bonusActionMax: doc.bonusActionMax ?? 1,
    };

    return state;
  }

  /**
   * Quick check whether a character currently has an active combat
   */
  async isInCombat(characterId: string): Promise<boolean> {
    const state = await this.getCombatState(characterId);
    return !!state && state.inCombat === true;
  }

  /**
   * Process enemy attacks and return defeat result if player is defeated
   */
  private processEnemyAttacks(
    state: CombatStateDto,
    aliveEnemies: CombatEnemyDto[],
    enemyAttacks: AttackResultDto[],
    narrativeParts: string[],
    playerAttacks: AttackResultDto[],
  ): TurnResultDto | null {
    let defeatResult: TurnResultDto | null = null;

    aliveEnemies.some((enemy) => {
      const enemyAttack = this.performAttack(
        {
          name: enemy.name,
          attackBonus: enemy.attackBonus,
          damageDice: enemy.damageDice,
          damageBonus: enemy.damageBonus,
        },
        {
          name: state.player.name,
          ac: state.player.ac,
          hp: state.player.hp,
        },
        false,
      );

      // Update player HP
      state.player.hp = enemyAttack.targetHpAfter;
      enemyAttacks.push(enemyAttack);
      narrativeParts.push(this.generateAttackNarrative(enemyAttack, false));

      // Check for defeat
      if (state.player.hp <= 0) {
        state.inCombat = false;
        defeatResult = {
          turnNumber: state.currentTurnIndex,
          roundNumber: state.roundNumber,
          playerAttacks,
          enemyAttacks,
          combatEnded: true,
          victory: false,
          defeat: true,
          remainingEnemies: aliveEnemies,
          playerHp: 0,
          playerHpMax: state.player.hpMax,
          narrative: narrativeParts.join('\n\n') + '\n\nDéfaite... Vous tombez inconscient.',
        };

        this.logger.log(`Combat ended for ${state.characterId}: Defeat`);
        return true; // Stop processing further enemies
      }

      return false; // Continue processing
    });

    return defeatResult;
  }

  /**
   * Calculate XP reward for defeated enemies
   */
  calculateXpReward(enemies: CombatEnemyDto[]): number {
    // Simple XP calculation based on enemy HP totals
    // In a full implementation, this would use CR tables
    return enemies.reduce((total, enemy) => total + enemy.hpMax * 10, 0);
  }

  /**
   * End combat and generate final result
   */
  async endCombat(characterId: string): Promise<{
    xpGained: number;
    enemiesDefeated: string[];
  } | null> {
    const state = await this.getCombatState(characterId);
    if (!state) {
      return null;
    }

    const defeatedEnemies = state.enemies.filter(e => e.hp <= 0);
    const xpGained = this.calculateXpReward(defeatedEnemies);

    // Delete combat session from database
    await this.combatSessionModel.deleteOne({ characterId });
    this.logger.log(`Combat cleaned up for ${characterId}`);

    return {
      xpGained,
      enemiesDefeated: defeatedEnemies.map(e => e.name),
    };
  }

  /**
   * Build victory result when all enemies are defeated
   */
  private async buildVictoryResult(state: CombatStateDto, characterId: string, enemy: CombatEnemyDto, damageDealt: number): Promise<TurnResultWithInstructionsDto> {
    const end = await this.endCombat(characterId);
    return {
      turnNumber: state.currentTurnIndex,
      roundNumber: state.roundNumber,
      playerAttacks: [],
      enemyAttacks: [],
      combatEnded: true,
      victory: true,
      defeat: false,
      remainingEnemies: [],
      playerHp: state.player.hp,
      playerHpMax: state.player.hpMax,
      narrative: `Vous infligez ${damageDealt} dégâts et terrassez ${enemy.name}. Victoire!`,
      instructions: end
        ? [
            {
              type: 'xp',
              xp: end.xpGained,
            } as XpInstructionMessageDto,
          ]
        : [],
    };
  }

  /**
   * Build turn result after processing damage and enemy attacks
   */
  private buildDamageTurnResult(
    state: CombatStateDto,
    playerAttacks: AttackResultDto[],
    enemyAttacks: AttackResultDto[],
    narrativeParts: string[],
  ): TurnResultDto {
    return {
      turnNumber: state.currentTurnIndex,
      roundNumber: state.roundNumber,
      playerAttacks,
      enemyAttacks,
      combatEnded: false,
      victory: false,
      defeat: false,
      remainingEnemies: state.enemies,
      playerHp: state.player.hp,
      playerHpMax: state.player.hpMax,
      narrative: narrativeParts.join('\n\n'),
    };
  }

  /**
   * Find enemy and apply damage, returning damage dealt
   */
  private applyDamageToTargetEnemy(state: CombatStateDto, targetName: string, damage: number): {
    enemy: CombatEnemyDto;
    damageDealt: number;
  } | null {
    const enemy = state.enemies.find(e => e.name.toLowerCase() === targetName.toLowerCase());
    if (!enemy) return null;
    const before = enemy.hp;
    enemy.hp = Math.max(0, enemy.hp - Math.max(0, Math.floor(damage)));
    return {
      enemy,
      damageDealt: before - enemy.hp,
    };
  }

  /**
   * Process enemy attacks and advance turn if needed
   */
  private async processDamageEnemyPhase(
    state: CombatStateDto,
    alive: CombatEnemyDto[],
    narrativeParts: string[],
  ): Promise<TurnResultDto | null> {
    const playerAttacks: AttackResultDto[] = [];
    const enemyAttacks: AttackResultDto[] = [];

    const enemyResult = this.processEnemyAttacks(state, alive, enemyAttacks, narrativeParts, playerAttacks);
    if (enemyResult) {
      await this.saveCombatState(state);
      return enemyResult;
    }

    state.currentTurnIndex = (state.currentTurnIndex + 1) % state.turnOrder.length;
    state.roundNumber++;
    await this.saveCombatState(state);

    return this.buildDamageTurnResult(state, playerAttacks, enemyAttacks, narrativeParts);
  }

  /**
   * Apply damage reported by client to a named enemy and persist state.
   * Decrements action counter. Does NOT auto-advance turn - player must call end-activation.
   */
  async applyDamageToEnemy(characterId: string, targetName: string, damage: number): Promise<TurnResultWithInstructionsDto | TurnResultDto | null> {
    const state = await this.getCombatState(characterId);
    if (!state?.inCombat) return null;

    // Decrement action (attack consumes an action)
    this.decrementAction(state);

    const result = this.applyDamageToTargetEnemy(state, targetName, damage);
    if (!result) return null;

    // Update turn order if enemy died
    if (result.enemy.hp <= 0) {
      this.rebuildTurnOrderAfterDeath(state);
    }

    await this.saveCombatState(state);

    const alive = state.enemies.filter(e => e.hp > 0);
    if (alive.length === 0) {
      return this.buildVictoryResult(state, characterId, result.enemy, result.damageDealt);
    }

    let narrativeParts = [`Vous infligez ${result.damageDealt} dégâts à ${result.enemy.name} (PV restants: ${result.enemy.hp}).`];

    if (result.damageDealt == 0) {
      narrativeParts = [`Vous ratez votre attaque contre ${result.enemy.name} et n'infligez aucun dégât.`];
    }

    // Return result WITHOUT auto-advancing turn
    // Player must explicitly call end-activation to advance
    const turnResult: TurnResultWithInstructionsDto = {
      turnNumber: state.currentTurnIndex,
      roundNumber: state.roundNumber,
      playerAttacks: [],
      enemyAttacks: [],
      combatEnded: false,
      victory: false,
      defeat: false,
      remainingEnemies: alive,
      playerHp: state.player.hp,
      playerHpMax: state.player.hpMax,
      narrative: narrativeParts.join('\n\n'),
      instructions: [],
      // Include action economy for client
      actionRemaining: state.actionRemaining,
      actionMax: state.actionMax,
      bonusActionRemaining: state.bonusActionRemaining,
      bonusActionMax: state.bonusActionMax,
      phase: state.phase,
    };

    return turnResult;
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
   * Decrement action counter after an attack.
   * Returns false if no actions remaining.
   */
  decrementAction(state: CombatStateDto): boolean {
    if ((state.actionRemaining ?? 0) <= 0) return false;
    state.actionRemaining = (state.actionRemaining ?? 1) - 1;
    return true;
  }

  /**
   * Decrement bonus action counter.
   * Returns false if no bonus actions remaining.
   */
  decrementBonusAction(state: CombatStateDto): boolean {
    if ((state.bonusActionRemaining ?? 0) <= 0) return false;
    state.bonusActionRemaining = (state.bonusActionRemaining ?? 1) - 1;
    return true;
  }

  /**
   * Reset action economy for a new player activation
   */
  private resetActionEconomy(state: CombatStateDto): void {
    state.actionRemaining = state.actionMax ?? 1;
    state.bonusActionRemaining = state.bonusActionMax ?? 1;
  }

  /**
   * Process a single enemy activation (one enemy attacks)
   */
  private processSingleEnemyActivation(
    state: CombatStateDto,
    enemy: CombatEnemyDto,
    enemyAttacks: AttackResultDto[],
    narrativeParts: string[],
  ): TurnResultDto | null {
    const enemyAttack = this.performAttack(
      {
        name: enemy.name,
        attackBonus: enemy.attackBonus,
        damageDice: enemy.damageDice,
        damageBonus: enemy.damageBonus,
      },
      {
        name: state.player.name,
        ac: state.player.ac,
        hp: state.player.hp,
      },
      false,
    );

    state.player.hp = enemyAttack.targetHpAfter;
    enemyAttacks.push(enemyAttack);
    narrativeParts.push(this.generateAttackNarrative(enemyAttack, false));

    if (state.player.hp <= 0) {
      state.inCombat = false;
      state.phase = 'COMBAT_ENDED';
      return {
        turnNumber: state.currentTurnIndex,
        roundNumber: state.roundNumber,
        playerAttacks: [],
        enemyAttacks,
        combatEnded: true,
        victory: false,
        defeat: true,
        remainingEnemies: state.enemies.filter(e => e.hp > 0),
        playerHp: 0,
        playerHpMax: state.player.hpMax,
        narrative: narrativeParts.join('\n\n') + '\n\nDéfaite... Vous tombez inconscient.',
      };
    }
    return null;
  }

  /**
   * Advance turn to next combatant, processing enemy activations automatically.
   * Stops when reaching a player activation or end of round.
   */
  private advanceTurn(
    state: CombatStateDto,
    enemyAttacks: AttackResultDto[],
    narrativeParts: string[],
  ): TurnResultDto | null {
    const totalCombatants = state.turnOrder.length;
    let iterations = 0;
    const maxIterations = totalCombatants + 1;

    while (iterations < maxIterations) {
      iterations++;
      state.currentTurnIndex = (state.currentTurnIndex + 1) % totalCombatants;

      // Check if we completed a round
      if (state.currentTurnIndex === 0) {
        state.roundNumber++;
        this.logger.debug(`Round ${state.roundNumber} started for ${state.characterId}`);
      }

      const currentCombatant = state.turnOrder[state.currentTurnIndex];

      if (currentCombatant.isPlayer) {
        // Player's turn - reset action economy and stop
        this.resetActionEconomy(state);
        state.phase = 'PLAYER_TURN';
        return null;
      }

      // Enemy turn - process attack
      const enemy = state.enemies.find(e => e.id === currentCombatant.id && e.hp > 0);
      if (enemy) {
        state.phase = 'ENEMY_TURN';
        const defeatResult = this.processSingleEnemyActivation(state, enemy, enemyAttacks, narrativeParts);
        if (defeatResult) return defeatResult;
      }
      // If enemy dead, continue to next combatant
    }

    // Fallback - should not reach here normally
    state.phase = 'PLAYER_TURN';
    this.resetActionEconomy(state);
    return null;
  }

  /**
   * End the current player activation explicitly.
   * This is the main entry point for advancing turns - player must call this.
   * Enemy activations are resolved automatically until next player activation.
   */
  async endPlayerActivation(characterId: string): Promise<TurnResultWithInstructionsDto | null> {
    const state = await this.getCombatState(characterId);
    if (!state?.inCombat) return null;

    const currentCombatant = state.turnOrder[state.currentTurnIndex];
    if (!currentCombatant?.isPlayer) {
      this.logger.warn(`endPlayerActivation called but current combatant is not player: ${currentCombatant?.name}`);
      return null;
    }

    const enemyAttacks: AttackResultDto[] = [];
    const narrativeParts: string[] = [`Vous terminez votre tour.`];

    // Advance turn and process enemy activations
    const defeatResult = this.advanceTurn(state, enemyAttacks, narrativeParts);

    await this.saveCombatState(state);

    if (defeatResult) {
      return {
        ...defeatResult,
        instructions: [],
      };
    }

    // Build result with enemy attacks
    const result: TurnResultWithInstructionsDto = {
      turnNumber: state.currentTurnIndex,
      roundNumber: state.roundNumber,
      playerAttacks: [],
      enemyAttacks,
      combatEnded: false,
      victory: false,
      defeat: false,
      remainingEnemies: state.enemies.filter(e => e.hp > 0),
      playerHp: state.player.hp,
      playerHpMax: state.player.hpMax,
      narrative: narrativeParts.join('\n\n'),
      instructions: [],
      // Include action economy in response for client
      actionRemaining: state.actionRemaining,
      actionMax: state.actionMax,
      bonusActionRemaining: state.bonusActionRemaining,
      bonusActionMax: state.bonusActionMax,
      phase: state.phase,
    };

    return result;
  }
}
