import { Injectable, Logger } from '@nestjs/common';
import type { CharacterDto } from '@rpg-gen/shared';
import { DiceController } from '../dice/dice.controller.js';
import { calculateArmorClass, getDexModifier } from '../character/armor-class.util.js';
import type {
  AttackResult,
  CombatEnemy,
  CombatPlayer,
  CombatStartInstruction,
  CombatState,
  Combatant,
  TurnResult,
} from './combat.types.js';

/**
 * Service managing combat state and mechanics.
 *
 * NOTE: Combat state is currently stored in-memory, which means:
 * - State is lost on server restart
 * - State is not shared across multiple server instances
 *
 * For production use, consider persisting combat state to the database
 * (e.g., a CombatSession collection) to ensure durability and scalability.
 */
@Injectable()
export class CombatService {
  private readonly logger = new Logger(CombatService.name);

  // In-memory combat state storage - see class-level comment about production considerations
  private combatStates = new Map<string, CombatState>();
  private diceController = new DiceController();

  /**
   * Get ability modifier for attack calculations
   */
  private getStrModifier(character: CharacterDto): number {
    const strScore = character.scores?.Str ?? 10;
    return Math.floor((strScore - 10) / 2);
  }

  /**
   * Calculate attack bonus based on character stats
   */
  private calculatePlayerAttackBonus(character: CharacterDto): number {
    const strMod = this.getStrModifier(character);
    const proficiency = character.proficiency ?? 2;
    return strMod + proficiency;
  }

  /**
   * Calculate damage bonus (STR modifier by default)
   */
  private calculatePlayerDamageBonus(character: CharacterDto): number {
    return this.getStrModifier(character);
  }

  /**
   * Get the player's main weapon damage dice
   */
  private getPlayerDamageDice(character: CharacterDto): string {
    // Check equipped weapons in inventory
    const equipped = character.inventory?.find(
      item => item.equipped && item.meta?.type === 'weapon',
    );

    if (equipped && equipped.meta?.damage) {
      return String(equipped.meta.damage);
    }

    // Default unarmed strike
    return '1d4';
  }

  /**
   * Initialize combat state from combat_start instruction
   */
  initializeCombat(
    character: CharacterDto,
    combatStart: CombatStartInstruction,
  ): CombatState {
    const characterId = character.characterId;

    // Build player combat stats
    const player: CombatPlayer = {
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
    const enemies: CombatEnemy[] = combatStart.combat_start.map((enemy, idx) => {
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
    const combatants: Combatant[] = [
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

    const state: CombatState = {
      characterId,
      inCombat: true,
      enemies,
      player,
      turnOrder,
      currentTurnIndex: 0,
      roundNumber: 1,
    };

    this.combatStates.set(characterId, state);
    this.logger.log(`Combat initialized for ${characterId} with ${enemies.length} enemies`);

    return state;
  }

  /**
   * Check if character is currently in combat
   */
  isInCombat(characterId: string): boolean {
    const state = this.combatStates.get(characterId);
    return state?.inCombat ?? false;
  }

  /**
   * Get current combat state
   */
  getCombatState(characterId: string): CombatState | undefined {
    return this.combatStates.get(characterId);
  }

  /**
   * Perform a single attack
   */
  private performAttack(
    attacker: { name: string; attackBonus: number; damageDice: string; damageBonus: number },
    target: { name: string; ac: number; hp: number },
    _isPlayerAttack: boolean,
  ): AttackResult {
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
  private generateAttackNarrative(result: AttackResult, isPlayerAttack: boolean): string {
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
  processPlayerAttack(characterId: string, targetName: string): TurnResult | null {
    const state = this.combatStates.get(characterId);
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
  private executeTurn(state: CombatState, targetEnemy: CombatEnemy): TurnResult {
    const playerAttacks: AttackResult[] = [];
    const enemyAttacks: AttackResult[] = [];
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
      const turnResult: TurnResult = {
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

    // Enemy attacks
    for (const enemy of aliveEnemies) {
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
        const turnResult: TurnResult = {
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
        return turnResult;
      }
    }

    // Increment round
    state.roundNumber++;

    const turnResult: TurnResult = {
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
   * Calculate XP reward for defeated enemies
   */
  calculateXpReward(enemies: CombatEnemy[]): number {
    // Simple XP calculation based on enemy HP totals
    // In a full implementation, this would use CR tables
    return enemies.reduce((total, enemy) => total + enemy.hpMax * 10, 0);
  }

  /**
   * End combat and generate final result
   */
  endCombat(characterId: string): { xpGained: number; enemiesDefeated: string[] } | null {
    const state = this.combatStates.get(characterId);
    if (!state) {
      return null;
    }

    const defeatedEnemies = state.enemies.filter(e => e.hp <= 0);
    const xpGained = this.calculateXpReward(defeatedEnemies);

    this.combatStates.delete(characterId);
    this.logger.log(`Combat cleaned up for ${characterId}`);

    return {
      xpGained,
      enemiesDefeated: defeatedEnemies.map(e => e.name),
    };
  }

  /**
   * Get list of valid targets for player
   */
  getValidTargets(characterId: string): string[] {
    const state = this.combatStates.get(characterId);
    if (!state || !state.inCombat) {
      return [];
    }

    return state.enemies.filter(e => e.hp > 0).map(e => e.name);
  }

  /**
   * Get combat status summary
   */
  getCombatSummary(characterId: string): string | null {
    const state = this.combatStates.get(characterId);
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
