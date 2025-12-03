import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CharacterService } from '../../domain/character/character.service.js';
import type { RollInstructionMessageDto } from '../../domain/chat/dto/index.js';
import { CombatService } from '../../domain/combat/combat.service.js';
import type {
  CombatEndResponseDto,
  CombatStartRequestDto,
  CombatStateDto,
  TurnResultWithInstructionsDto,
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
    private readonly combatService: CombatService,
    private readonly characterService: CharacterService,
    // ActionRecordService removed — orchestrator will no longer persist action tokens.
    private readonly diceService: DiceService,
  ) {}

  /**
   * Initialize combat for a character.
   * Loads character data, initializes combat state, and generates first action token.
   */
  async startCombat(
    userId: string,
    characterId: string,
    combatStartRequest: CombatStartRequestDto,
  ): Promise<CombatStateDto & { actionToken: string;
    expectedDto: string; }> {
    const characterDto = await this.characterService.findByCharacterId(userId, characterId);
    const state = await this.combatService.initializeCombat(characterDto, combatStartRequest, userId);

    // Generate ephemeral token for client convenience (no persistence / idempotence)
    const actionToken = `t-${randomUUID()}`;

    this.logger.log(`Combat started for character ${characterId} with ${combatStartRequest.combat_start.length} enemies`);

    return {
      ...state,
      narrative: (await this.combatService.getCombatSummary(characterId)) ?? undefined,
      phase: 'PLAYER_TURN' as const,
      actionToken,
      expectedDto: 'AttackRequestDto',
    };
  }

  /**
   * Process a player attack action.
   * Validates token, performs attack roll, and returns result or damage roll instruction.
   */
  // eslint-disable-next-line max-statements
  async processAttack(
    userId: string,
    characterId: string,
    targetId: string,
  ): Promise<TurnResultWithInstructionsDto> {
    // Validate combat is active
    if (!(await this.combatService.isInCombat(characterId))) {
      throw new BadRequestException('Character is not in combat');
    }

    // No action token persistence — we proceed directly

    const state = await this.combatService.getCombatState(characterId);
    if (!state) throw new BadRequestException('No combat state found');

    // Find target enemy
    const targetEnemy = state.enemies.find(
      e => e.id.toLowerCase() === (targetId || '').toLowerCase() && e.hp > 0,
    );
    if (!targetEnemy) {
      const validTargets = await this.combatService.getValidTargets(characterId);
      throw new BadRequestException(`Invalid target: ${targetId}. Valid targets: ${validTargets.join(', ')}`);
    }

    // Server-side attack roll
    const attackRoll = this.diceService.rollDiceExpr('1d20');
    const [die] = attackRoll.rolls;
    const totalAttack = die + (state.player.attackBonus || 0);
    const critical = die === 20;
    const fumble = die === 1;
    const hit = critical || (totalAttack >= targetEnemy.ac && !fumble);

    if (!hit) {
      // Miss: apply zero damage and advance turn
      const res = await this.combatService.applyDamageToEnemy(characterId, targetEnemy.name, 0);
      if (!res) throw new BadRequestException('Failed to advance turn after miss');
      return res;
    }

    // Hit: instruct client to roll damage
    const instructions: RollInstructionMessageDto = {
      type: 'roll',
      dices: state.player.damageDice || '1d4',
      modifierValue: state.player.damageBonus || 0,
      meta: {
        action: 'damage',
        target: targetEnemy.name,
        damageBonus: state.player.damageBonus || 0,
      },
      description: `Damage to ${targetEnemy.name}`,
    };

    // mark state as awaiting client damage roll and return a minimal turn result
    state.phase = 'AWAITING_DAMAGE_ROLL';

    const response: TurnResultWithInstructionsDto = {
      turnNumber: state.currentTurnIndex,
      roundNumber: state.roundNumber,
      playerAttacks: [],
      enemyAttacks: [],
      combatEnded: false,
      victory: false,
      defeat: false,
      state,
      remainingEnemies: state.enemies,
      playerHp: state.player.hp,
      playerHpMax: state.player.hpMax,
      narrative: `Attaque réussie (${die} + ${state.player.attackBonus || 0} = ${totalAttack} vs AC ${targetEnemy.ac}). Lancez les dégâts.`,
      rollInstruction: instructions,
      // state contains action economy and phase; avoid flattening these fields here
    };

    // No persistence of token state — resolving of rolls will be handled directly

    return response;
  }

  /**
   * Get current combat status with fresh action token.
   */
  async getStatus(
    userId: string,
    characterId: string,
  ): Promise<CombatStateDto> {
    await this.characterService.findByCharacterId(userId, characterId);

    const inCombat = await this.combatService.isInCombat(characterId);
    if (!inCombat) throw new BadRequestException('No combat at the moment');

    const state = await this.combatService.getCombatState(characterId);
    if (!state) throw new BadRequestException('No combat at the moment');

    return {
      ...state,
      enemies: state.enemies.filter(e => e.hp > 0),
      validTargets: await this.combatService.getValidTargets(characterId),
      phase: 'PLAYER_TURN' as const,
    };
  }

  /**
   * Force end combat (flee).
   */
  async endCombat(userId: string, characterId: string): Promise<CombatEndResponseDto> {
    const character = await this.characterService.findByCharacterId(userId, characterId);
    if (!character) {
      throw new BadRequestException('Character not found');
    }

    if (!(await this.combatService.isInCombat(characterId))) {
      return {
        success: false,
        message: 'Aucun combat en cours.',
      };
    }

    await this.combatService.endCombat(characterId);
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
   * Process combat end after victory (distribute XP, generate loot).
   * Called internally when combat ends with victory.
   */
  async processCombatVictory(
    userId: string,
    characterId: string,
  ): Promise<{ xpGained: number;
    enemiesDefeated: string[]; }> {
    const result = await this.combatService.endCombat(characterId);
    if (!result) {
      return {
        xpGained: 0,
        enemiesDefeated: [],
      };
    }

    // Distribute XP to character
    const character = await this.characterService.findByCharacterId(userId, characterId);
    const newXp = (character.totalXp || 0) + result.xpGained;
    await this.characterService.update(userId, characterId, { totalXp: newXp });

    this.logger.log(`Combat victory for ${characterId}: +${result.xpGained} XP`);

    return result;
  }

  /**
   * Acquire and validate an action token.
   */
  // Token persistence removed — no-op / not needed

  /**
   * End the current player activation and advance turns.
   * Resolves enemy activations automatically until next player turn.
   */
  async endPlayerActivation(
    userId: string,
    characterId: string,
  ): Promise<TurnResultWithInstructionsDto> {
    // Validate character ownership
    await this.characterService.findByCharacterId(userId, characterId);

    if (!(await this.combatService.isInCombat(characterId))) {
      throw new BadRequestException('Character is not in combat');
    }

    const result = await this.combatService.endPlayerActivation(characterId);
    if (!result) {
      throw new BadRequestException('Failed to end player activation');
    }

    this.logger.log(`Player activation ended for ${characterId}. New round: ${result.roundNumber}`);

    return result;
  }
}
