import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CharacterService } from '../../domain/character/character.service.js';
import { CombatAppService } from '../../domain/combat/combat.app.service.js';
import type {
  AttackResponseDto,
  CombatEndResponseDto,
  CombatStartRequestDto,
  CombatStateDto,
  CombatantDto,
} from '../../domain/combat/dto/index.js';
import { DiceService } from '../../domain/dice/dice.service.js';

/**
 * CombatOrchestrator coordinates combat flows across multiple domain services.
 * Controllers should call this orchestrator instead of directly calling domain services.
 *
 * Responsibilities:
 * - Start combat (character lookup + combat initialization + token generation)
 * - Process attacks (token management + dice rolls + damage application)
 * - Resolve rolls (token validation + damage application)
 * - End combat (cleanup + XP distribution)
 */
@Injectable()
export class CombatOrchestrator {
  private readonly logger = new Logger(CombatOrchestrator.name);

  constructor(
    private readonly combatAppService: CombatAppService,
    private readonly characterService: CharacterService,
    private readonly diceService: DiceService,
  ) {}

  /**
   * Initialize combat for a character.
   * Loads character data, initializes combat state, and generates first action token.
   */
  // eslint-disable-next-line max-statements
  async startCombat(
    userId: string,
    characterId: string,
    combatStartRequest: CombatStartRequestDto,
  ): Promise<CombatStateDto> {
    const characterDto = await this.characterService.findByCharacterId(userId, characterId);
    let state = await this.combatAppService.initializeCombat(characterDto, combatStartRequest, userId);

    // Early return when there are no enemy turns before the player activation
    if (state.turnOrder.length === 0 || state.turnOrder[0].isPlayer) {
      this.logger.log(`Combat started for character ${characterId} with ${combatStartRequest.combat_start.length} enemies`);
      return {
        ...state,
        narrative: (await this.combatAppService.getCombatSummary(characterId)) ?? undefined,
        phase: 'PLAYER_TURN' as const,
      };
    }

    // If turn order begins with an enemy, simulate initial turns here
    const playerIndex = state.turnOrder.findIndex(c => c.isPlayer);
    const enemyTurnsBeforeFirstPlayer = playerIndex >= 0 ? state.turnOrder.slice(0, playerIndex) : state.turnOrder.slice();

    // Process sequentially — stop if the player dies
    const {
      state: processedState, playerDefeated,
    } = await this.processCombatantTurns(
      characterId,
      state,
      enemyTurnsBeforeFirstPlayer,
      (c: CombatantDto) => (c.isPlayer ? undefined : c.id), // no "as" casts needed
    );

    // Update to processed state
    state = processedState;

    if (playerDefeated) {
      await this.combatAppService.saveCombatState(state);
      this.logger.log(`Combat initialized (and ended) for ${characterId} after initial enemy turns`);
      const narrative = (await this.combatAppService.getCombatSummary(characterId)) ?? undefined;
      return {
        ...state,
        narrative,
        phase: 'PLAYER_TURN' as const,
      };
    }

    // Advance to player's activation and reset economy
    const finalState = await this.combatAppService.getCombatState(characterId);
    finalState.currentTurnIndex = finalState.turnOrder.findIndex(c => c.isPlayer) ?? 0;
    finalState.phase = 'PLAYER_TURN';
    finalState.actionRemaining = finalState.actionMax ?? 1;
    finalState.bonusActionRemaining = finalState.bonusActionMax ?? 1;
    await this.combatAppService.saveCombatState(finalState);

    // Use freshest state for return
    state = finalState;

    this.logger.log(`Combat started for character ${characterId} with ${combatStartRequest.combat_start.length} enemies`);

    return {
      ...state,
      narrative: (await this.combatAppService.getCombatSummary(characterId)) ?? undefined,
      phase: 'PLAYER_TURN' as const,
    };
  }

  /**
   * Process a player attack action.
   * Validates token, performs attack roll, and returns result or damage roll instruction.
   */
  async processAttack(
    characterId: string,
    targetId: string,
  ): Promise<AttackResponseDto> {
    // Validate combat is active
    if (!(await this.combatAppService.isInCombat(characterId))) {
      throw new BadRequestException('Character is not in combat');
    }

    let combatState = await this.combatAppService.getCombatState(characterId);

    // Find target enemy
    const targetEnemy = combatState.enemies.find(
      enemy => enemy.id.toLowerCase() === (targetId || '').toLowerCase() && (enemy.hp ?? 0) > 0,
    );
    const validTargetIds = combatState.enemies.filter(e => (e.hp ?? 0) > 0)
      .map(e => e.id)
      .join(', ');
    if (!targetEnemy) {
      throw new BadRequestException(`Invalid target: ${targetId}. Valid targets: ${validTargetIds}`);
    }

    // DiceService now exposes rollAttack that encapsulates the 1d20 logic (+crit/fumble)
    const attackRoll = this.diceService.rollAttack(combatState.player.attackBonus, targetEnemy.ac ?? 0);

    if (!attackRoll.hit) {
      // Decrement action (via CombatService) and persist to avoid client exploit / state mismatch
      combatState = this.combatAppService.decrementAction(combatState);
      await this.combatAppService.saveCombatState(combatState);

      return {
        combatState,
        diceResult: attackRoll.diceResult,
      };
    }

    // Hit: roll damage via DiceService (handles crit doubling) and get the damage result DTO
    const damageResult = this.diceService.rollDamage(combatState.player.damageDice, attackRoll.isCrit, combatState.player.damageBonus);

    // Apply damage and finalize via CombatService (persist, consume action, maybe end combat)
    const finalState = await this.combatAppService.applyPlayerDamage(characterId, targetId, damageResult.damageTotal); // or delegate with dice results

    return {
      combatState: finalState,
      diceResult: attackRoll.diceResult,
      damageDiceResult: damageResult,
      damageTotal: damageResult.damageTotal,
      isCrit: damageResult.isCrit,
    };
  }

  /**
   * faut faire jouer tous les enemies et calculer les dégats
   * retourner un tableau d'attaques
   */
  public async endPlayerTurn(characterId: string): Promise<CombatStateDto> {
    const combatState = await this.combatAppService.getCombatState(characterId);
    if (!combatState) throw new NotFoundException('combat state not found');

    combatState.phase = 'ENEMY_TURN';

    // Process enemy turns in order; an early stop is required if the player dies
    const aliveEnemies = combatState.enemies.filter(e => (e.hp ?? 0) > 0);
    await this.processCombatantTurns(
      characterId,
      combatState,
      aliveEnemies,
      (e: CombatantDto) => e.id,
    );

    // After enemies have acted, set back to player's turn and persist
    const finalState = await this.combatAppService.getCombatState(characterId);
    if (finalState) {
      finalState.phase = 'PLAYER_TURN';
      finalState.currentTurnIndex = finalState.turnOrder.findIndex(c => c.isPlayer) ?? 0;
      finalState.actionRemaining = finalState.actionMax ?? 1;
      finalState.bonusActionRemaining = finalState.bonusActionMax ?? 1;
      await this.combatAppService.saveCombatState(finalState);
      return finalState;
    }

    throw new NotFoundException('combat state not found after enemy turns');
  }

  /**
   * Get current combat status with fresh action token.
   */
  async getStatus(
    userId: string,
    characterId: string,
  ): Promise<CombatStateDto> {
    await this.characterService.findByCharacterId(userId, characterId);

    const inCombat = await this.combatAppService.isInCombat(characterId);
    if (!inCombat) throw new BadRequestException('No combat at the moment');

    const state = await this.combatAppService.getCombatState(characterId);
    if (!state) throw new BadRequestException('No combat at the moment');

    return state;
  }

  /**
   * Force end combat (flee).
   */
  async endCombat(userId: string, characterId: string): Promise<CombatEndResponseDto> {
    const character = await this.characterService.findByCharacterId(userId, characterId);
    if (!character) {
      throw new BadRequestException('Character not found');
    }

    if (!(await this.combatAppService.isInCombat(characterId))) {
      return {
        success: false,
        message: 'Aucun combat en cours.',
      };
    }

    await this.combatAppService.endCombat(characterId);
    this.logger.log(`Combat forcefully ended for ${characterId}`);

    return {
      success: true,
      message: 'Vous avez fui le combat.',
      instructions: [
        {
          combat_end: {
            victory: false,
            xp_gained: 0,
            player_hp: character.hp!,
            enemies_defeated: [],
            fled: true,
            narrative: 'Vous avez fui le combat.',
          },
        },
      ],
    };
  }

  /**
   * Process a sequence of combatant turns (enemy or turn-order entries).
   * - items: array of CombatantDto (turn order entries; enemy objects will have hp/ac etc set)
   * - getEnemyId maps an item to an enemyId (returns undefined to skip e.g. player entries).
   */
  private async processCombatantTurns(
    characterId: string,
    state: CombatStateDto,
    items: CombatantDto[],
    getEnemyId: (item: CombatantDto) => string | undefined,
  ): Promise<{ state: CombatStateDto;
    playerDefeated: boolean; }> {
    const result = await items.reduce(async (prevPromise, item) => {
      const acc = await prevPromise;
      if (acc.playerDefeated) return acc;

      const enemyId = getEnemyId(item);
      if (!enemyId) return acc;

      const enemy = acc.state.enemies.find(e => e.id === enemyId && (e.hp ?? 0) > 0);
      if (!enemy) return acc;

      const attackRoll = this.diceService.rollAttack(enemy.attackBonus ?? 0, acc.state.player.ac);
      if (!attackRoll.hit) return acc;

      const damageResult = this.diceService.rollDamage(enemy.damageDice ?? '1d6', attackRoll.isCrit, enemy.damageBonus ?? 0);
      // applyEnemyDamage returns a refreshed state
      const updated = await this.combatAppService.applyEnemyDamage(characterId, damageResult.damageTotal);
      acc.state = updated;
      acc.playerDefeated = !!(updated.player && updated.player.hp <= 0);
      return acc;
    }, Promise.resolve({
      state,
      playerDefeated: false,
    }));

    return result;
  }
}
