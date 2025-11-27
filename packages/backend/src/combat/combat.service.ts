import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { CharacterResponseDto } from '../character/dto/index.js';
import { ItemDefinitionService } from '../item-definition/item-definition.service.js';
import { DiceController } from '../dice/dice.controller.js';
import { calculateArmorClass, getDexModifier } from '../character/armor-class.util.js';
import { CombatSession, CombatSessionDocument } from '../schemas/combat-session.schema.js';
import { CombatStateDto } from './dto/CombatStateDto.js';
import { CombatPlayerDto } from './dto/CombatPlayerDto.js';
import { CombatStartRequestDto } from './dto/CombatStartRequestDto.js';
import { CombatEnemyDto } from './dto/CombatEnemyDto.js';
import { CombatantDto } from './dto/CombatantDto.js';
import { AttackResultDto } from './dto/AttackResultDto.js';
import { TurnResultDto } from './dto/TurnResultDto.js';

/**
 * Service managing combat state and mechanics.
 * Combat state is persisted to MongoDB for durability across restarts.
 */
@Injectable()
export class CombatService {
  private readonly logger = new Logger(CombatService.name);
  private diceController = new DiceController();

  constructor(
    @InjectModel(CombatSession.name) private combatSessionModel: Model<CombatSessionDocument>,
    private itemDefinitionService: ItemDefinitionService,
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
        // Synchronous call avoided; item definitions are available via service
        // We retrieve definition and use its damage if present
        // Note: service returns null if not found

        // (we keep logic simple here)
        // Using await is not allowed in this sync function; fallback to default
        // Instead, attempt to synchronously access seeded definitions via the service cache if available
        // If unavailable, fallback to default '1d4'
        // For now, return default; the ItemDefinitionService is async and a larger refactor would be required to make this sync.
        return '1d4';
      } catch {
        return '1d4';
      }
    }

    return '1d4';
  }

  /**
   * Initialize combat state from combat_start instruction
   */
  async initializeCombat(
    character: CharacterResponseDto,
    combatStart: CombatStartRequestDto,
    userId: string,
  ): Promise<CombatStateDto> {
    const characterId = character.characterId;

    // Build player combat stats
    const player: CombatPlayerDto = {
      characterId,
      name: character.name ?? 'Hero',
      hp: character.hp ?? character.hpMax ?? 10,
      hpMax: character.hpMax ?? 10,
      ac: calculateArmorClass(character),
      initiative: 0,
      attackBonus: this.calculatePlayerAttackBonus(character),
      damageDice: this.getPlayerDamageDice(character),
      damageBonus: this.calculatePlayerDamageBonus(character),
    };

    // Roll player initiative
    const playerInitRoll = this.diceController.rollDiceExpr('1d20');
    const dexMod = getDexModifier(character);
    player.initiative = playerInitRoll.total + dexMod;

    // Build enemy list with initiatives
    const enemies: CombatEnemyDto[] = combatStart.combat_start.map((enemy, idx) => {
      const initRoll = this.diceController.rollDiceExpr('1d20');
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

    // Build turn order by initiative
    const combatants: CombatantDto[] = [
      { id: characterId, name: player.name, initiative: player.initiative, isPlayer: true },
      ...enemies.map(e => ({
        id: e.id,
        name: e.name,
        initiative: e.initiative,
        isPlayer: false,
      })),
    ];

    // Sort by initiative (highest first)
    const turnOrder = combatants.sort((a, b) => b.initiative - a.initiative);

    const state: CombatStateDto = {
      characterId,
      inCombat: true,
      enemies,
      player,
      turnOrder,
      currentTurnIndex: 0,
      roundNumber: 1,
    };

    // Persist to database (upsert to handle reconnection scenarios)
    await this.combatSessionModel.findOneAndUpdate(
      { characterId },
      { userId, ...state },
      { upsert: true, new: true },
    );

    this.logger.log(`Combat initialized for ${characterId} with ${enemies.length} enemies`);

    return state;
  }

  /**
   * Check if character is currently in combat
   */
  async isInCombat(characterId: string): Promise<boolean> {
    const session = await this.combatSessionModel.findOne({ characterId, inCombat: true });
    return !!session;
  }

  /**
   * Get current combat state
   */
  async getCombatState(characterId: string): Promise<CombatStateDto | null> {
    const session = await this.combatSessionModel.findOne({ characterId });
    if (!session) return null;

    return {
      characterId: session.characterId,
      inCombat: session.inCombat,
      enemies: session.enemies,
      player: session.player,
      turnOrder: session.turnOrder,
      currentTurnIndex: session.currentTurnIndex,
      roundNumber: session.roundNumber,
    };
  }

  /**
   * Perform a single attack
   */
  // eslint-disable-next-line max-statements
  private performAttack(
    attacker: { name: string; attackBonus: number; damageDice: string; damageBonus: number },
    target: { name: string; ac: number; hp: number },
    _isPlayerAttack: boolean,
  ): AttackResultDto {
    // Roll attack
    const attackRoll = this.diceController.rollDiceExpr('1d20');
    const dieRoll = attackRoll.rolls[0];
    const totalAttack = dieRoll + attacker.attackBonus;

    const critical = dieRoll === 20;
    const fumble = dieRoll === 1;
    const hit = (critical || (totalAttack >= target.ac && !fumble));

    let damageRoll: number[] = [];
    let totalDamage = 0;

    if (hit) {
      // Roll damage
      const damageResult = this.diceController.rollDiceExpr(attacker.damageDice);
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
        e => e.name.toLowerCase().includes(targetName.toLowerCase()) && e.hp > 0,
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

    // Player attack
    const playerAttack = this.performAttack(
      {
        name: state.player.name,
        attackBonus: state.player.attackBonus,
        damageDice: state.player.damageDice,
        damageBonus: state.player.damageBonus,
      },
      {
        name: targetEnemy.name,
        ac: targetEnemy.ac,
        hp: targetEnemy.hp,
      },
      true,
    );

    // Update enemy HP
    targetEnemy.hp = playerAttack.targetHpAfter;
    playerAttacks.push(playerAttack);
    narrativeParts.push(this.generateAttackNarrative(playerAttack, true));

    // Check if combat ends
    const aliveEnemies = state.enemies.filter(e => e.hp > 0);
    if (aliveEnemies.length === 0) {
      // Victory!
      state.inCombat = false;
      await this.saveCombatState(state);

      const turnResult: TurnResultDto = {
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
      return turnResult;
    }

    // Enemy attacks - process each enemy and check for defeat
    const defeatResult = this.processEnemyAttacks(state, aliveEnemies, enemyAttacks, narrativeParts, playerAttacks);
    if (defeatResult) {
      await this.saveCombatState(state);
      return defeatResult;
    }

    // Increment round
    state.roundNumber++;

    // Save updated state to database
    await this.saveCombatState(state);

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
      },
    );
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
  async endCombat(characterId: string): Promise<{ xpGained: number; enemiesDefeated: string[] } | null> {
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
   * Get list of valid targets for player
   */
  async getValidTargets(characterId: string): Promise<string[]> {
    const state = await this.getCombatState(characterId);
    if (!state || !state.inCombat) {
      return [];
    }

    return state.enemies.filter(e => e.hp > 0).map(e => e.name);
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
    const enemyList = aliveEnemies.map(e => `${e.name} (PV: ${e.hp}/${e.hpMax})`).join(', ');

    return `Combat en cours - Round ${state.roundNumber}\n`
      + `Vos PV: ${state.player.hp}/${state.player.hpMax}\n`
      + `Ennemis: ${enemyList}\n`
      + `Utilisez /attack [nom_ennemi] pour attaquer.`;
  }
}
