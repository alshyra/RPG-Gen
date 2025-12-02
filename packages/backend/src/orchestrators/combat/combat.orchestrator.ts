import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CharacterService } from '../../domain/character/character.service.js';
import type { CharacterResponseDto } from '../../domain/character/dto/index.js';
import { CombatService } from '../../domain/combat/combat.service.js';
import { ActionRecordService } from '../../domain/combat/action-record.service.js';
import {
  ActionRecord,
  ActionStatus,
} from '../../infra/mongo/action-record.schema.js';
import { DiceService } from '../../domain/dice/dice.service.js';
import type {
  CombatStartRequestDto,
  CombatStateDto,
  TurnResultWithInstructionsDto,
  CombatEndResponseDto,
  DiceThrowDto,
} from '../../domain/combat/dto/index.js';
import type { RollInstructionMessageDto } from '../../domain/chat/dto/index.js';

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
    private readonly actionRecordService: ActionRecordService,
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

    const actionToken = await this.actionRecordService.generateToken({
      requesterId: userId,
      combatId: characterId,
      expectedDto: 'AttackRequestDto',
    });

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
  async processAttack(
    userId: string,
    characterId: string,
    actionToken: string,
    targetId: string,
  ): Promise<TurnResultWithInstructionsDto> {
    // Validate combat is active
    if (!(await this.combatService.isInCombat(characterId))) {
      throw new BadRequestException('Character is not in combat');
    }

    // Acquire action token
    const acquired = await this.acquireActionToken(actionToken, userId, characterId, 'AttackRequestDto');
    if (acquired.alreadyApplied) {
      return acquired.record.resultPayload as TurnResultWithInstructionsDto;
    }

    const state = await this.combatService.getCombatState(characterId);
    if (!state) {
      await this.actionRecordService.setFailed(actionToken, { error: 'No combat state found' });
      throw new BadRequestException('No combat state found');
    }

    // Find target enemy
    const targetEnemy = state.enemies.find(
      e => e.id.toLowerCase() === (targetId || '').toLowerCase() && e.hp > 0,
    );
    if (!targetEnemy) {
      const validTargets = await this.combatService.getValidTargets(characterId);
      await this.actionRecordService.setFailed(actionToken, { error: 'Invalid target' });
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
      if (!res) {
        await this.actionRecordService.setFailed(actionToken, { error: 'Failed to advance turn after miss' });
        throw new BadRequestException('Failed to advance turn after miss');
      }
      await this.actionRecordService.setApplied(actionToken, res, { requesterId: userId });
      return res;
    }

    // Hit: instruct client to roll damage
    const instructions: RollInstructionMessageDto[] = [
      {
        type: 'roll',
        dices: state.player.damageDice || '1d4',
        modifierValue: state.player.damageBonus || 0,
        meta: {
          action: 'damage',
          target: targetEnemy.name,
          damageBonus: state.player.damageBonus || 0,
        },
        description: `Damage to ${targetEnemy.name}`,
      },
    ];

    const response: TurnResultWithInstructionsDto = {
      turnNumber: state.currentTurnIndex,
      roundNumber: state.roundNumber,
      playerAttacks: [],
      enemyAttacks: [],
      combatEnded: false,
      victory: false,
      defeat: false,
      remainingEnemies: state.enemies,
      playerHp: state.player.hp,
      playerHpMax: state.player.hpMax,
      narrative: `Attaque réussie (${die} + ${state.player.attackBonus || 0} = ${totalAttack} vs AC ${targetEnemy.ac}). Lancez les dégâts.`,
      instructions,
    };

    // Store partial attack info for damage resolution
    const partial = {
      attackRoll: die,
      attackBonus: state.player.attackBonus,
      totalAttack,
      targetAc: targetEnemy.ac,
      hit: true,
      critical,
      fumble,
    };
    await this.actionRecordService.setPendingWithExpected(actionToken, 'DiceThrowDto', partial, { requesterId: userId });

    return response;
  }

  /**
   * Resolve a damage roll and apply damage to target.
   */
  async resolveRoll(
    userId: string,
    characterId: string,
    actionToken: string,
    diceThrowDto: DiceThrowDto,
  ): Promise<TurnResultWithInstructionsDto> {
    this.logger.debug(`Resolving roll for character ${characterId} with token ${actionToken} and payload ${JSON.stringify(diceThrowDto)}`);
    if (!diceThrowDto || !diceThrowDto.action) {
      throw new BadRequestException('Invalid roll resolution payload', `${JSON.stringify(diceThrowDto)}`);
    }

    if (!(await this.combatService.isInCombat(characterId))) {
      throw new BadRequestException('Character is not in combat');
    }

    // Validate character ownership
    await this.characterService.findByCharacterId(userId, characterId);

    // Load and validate existing token
    const existing = await this.actionRecordService.getByToken(actionToken);
    if (!existing) throw new GoneException('Action token not found or expired');
    if (String(existing.requesterId) !== userId) {
      throw new ConflictException('Action token consumed by another requester');
    }
    if (existing.status === ActionStatus.APPLIED) {
      return existing.resultPayload as TurnResultWithInstructionsDto;
    }
    if (existing.expectedDto !== 'DiceThrowDto') {
      throw new BadRequestException('This action token is not awaiting a dice throw');
    }

    // Acquire token atomically
    const acquired = await this.actionRecordService.tryAcquire(actionToken, {
      requesterId: userId,
      combatId: characterId,
      expectedDto: 'DiceThrowDto',
    });
    if (!acquired.acquired) {
      const rec = acquired.record as ActionRecord | null;
      if (rec && rec.status === ActionStatus.APPLIED) {
        return rec.resultPayload as TurnResultWithInstructionsDto;
      }
      throw new ConflictException('Unable to acquire action token for processing');
    }

    try {
      if (diceThrowDto.action !== 'damage') {
        throw new BadRequestException('resolve-roll expects action = "damage" in this flow');
      }

      const partial = existing.resultPayload as { hit?: boolean } | undefined;
      if (!partial || !partial.hit) {
        throw new BadRequestException('No pending successful attack associated with this token');
      }

      const result = await this.combatService.applyDamageToEnemy(characterId, diceThrowDto.target, diceThrowDto.total);
      if (!result) throw new BadRequestException('Failed to apply damage');

      await this.actionRecordService.setApplied(actionToken, result, { requesterId: userId });
      return result;
    } catch (err) {
      await this.actionRecordService.setFailed(actionToken, { error: String(err) });
      throw err;
    }
  }

  /**
   * Get current combat status with fresh action token.
   */
  async getStatus(
    userId: string,
    characterId: string,
  ): Promise<(CombatStateDto & { actionToken?: string;
    expectedDto?: string;
    validTargets?: string[]; }) | { characterId: string;
      inCombat: false;
      narrative: string; }> {
    await this.characterService.findByCharacterId(userId, characterId);

    const inCombat = await this.combatService.isInCombat(characterId);
    if (!inCombat) {
      return {
        characterId,
        inCombat: false,
        narrative: 'Aucun combat en cours.',
      };
    }

    const state = await this.combatService.getCombatState(characterId);
    if (!state) {
      return {
        characterId,
        inCombat: false,
        narrative: 'Aucun combat en cours.',
      };
    }

    const actionToken = await this.actionRecordService.generateToken({
      requesterId: userId,
      combatId: characterId,
      expectedDto: 'AttackRequestDto',
    });

    return {
      ...state,
      enemies: state.enemies.filter(e => e.hp > 0),
      validTargets: await this.combatService.getValidTargets(characterId),
      narrative: (await this.combatService.getCombatSummary(characterId)) ?? undefined,
      phase: 'PLAYER_TURN' as const,
      actionToken,
      expectedDto: 'AttackRequestDto',
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
  private async acquireActionToken(
    actionToken: string,
    userId: string,
    combatId: string,
    expectedDto: string,
  ): Promise<{ alreadyApplied: boolean;
    record: ActionRecord; }> {
    const exists = await this.actionRecordService.getByToken(actionToken);
    if (!exists) throw new GoneException('Action token not found or expired');

    const acquire = await this.actionRecordService.tryAcquire(actionToken, {
      requesterId: userId,
      combatId,
      expectedDto,
      idempotencyKey: undefined,
    });

    if (!acquire.acquired) {
      const record = acquire.record as ActionRecord | null;
      if (record && String(record.requesterId) !== userId) {
        throw new ConflictException('Action token already consumed by another requester');
      }
      if (record && record.status === ActionStatus.APPLIED) {
        return {
          alreadyApplied: true,
          record,
        };
      }
      throw new BadRequestException('Unable to acquire action token');
    }

    return {
      alreadyApplied: false,
      record: acquire.record as ActionRecord,
    };
  }

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
