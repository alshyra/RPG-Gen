import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CharacterService } from '../../domain/character/character.service.js';
import { CombatService } from '../../domain/combat/combat.service.js';
import type {
  AttackResponseDto,
  CombatEndResponseDto,
  CombatStartRequestDto,
  CombatStateDto,
} from '../../domain/combat/dto/index.js';
import { DiceService } from '../../domain/dice/dice.service.js';
import { DiceResultDto } from 'src/domain/dice/dto/DiceResultDto.js';
import { CombatDiceResultDto } from 'src/domain/dice/dto/CombatDiceResultDto.js';

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

  private rollAttackDice(attackBonus: number, targetEnemyAc: number): [boolean, DiceResultDto] {
    const diceResult = this.diceService.rollDiceExpr('1d20');
    const [die] = diceResult.rolls;
    const totalAttack = die + attackBonus;
    const critical = die === 20;
    const fumble = die === 1;
    const hit = critical || (totalAttack >= targetEnemyAc && !fumble);
    return [hit, diceResult];
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
    if (!(await this.combatService.isInCombat(characterId))) {
      throw new BadRequestException('Character is not in combat');
    }

    const combatState = await this.combatService.getCombatState(characterId);
    if (!combatState) throw new BadRequestException('No combat state found');

    // Find target enemy
    const targetEnemy = combatState.enemies.find(
      enemy => enemy.id.toLowerCase() === (targetId || '').toLowerCase() && enemy.hp > 0,
    );
    if (!targetEnemy) {
      const validTargets = await this.combatService.getValidTargets(characterId);
      throw new BadRequestException(`Invalid target: ${targetId}. Valid targets: ${validTargets.join(', ')}`);
    }

    const [hit, diceResult] = this.rollAttackDice(combatState.player.attackBonus, targetEnemy.ac);

    if (!hit) {
      this.combatService.decrementAction(combatState);
      return {
        combatState,
        diceResult,
      };
    }

    // Hit: immediately roll damage and apply
    return this.applyDamage(characterId, targetEnemy.id, diceResult);
  }

  /**
   * faut faire jouer tous les enemies et calculer les dégats
   * retourner un tableau d'attaques
   */
  public async endPlayerTurn(characterId: string): Promise<CombatStateDto> {
    const combatState = await this.combatService.getCombatState(characterId);
    if (!combatState || !combatState.validTargets) throw new NotFoundException('combat state not found');

    combatState.phase = 'ENEMY_TURN';
    const enemyActivations = combatState.enemies
      .filter(enemy => enemy.hp > 0)
      .map(enemy => this.combatService.processSingleEnemyActivation(combatState, enemy));

    // Wait for all activations to process (processSingleEnemyActivation might be async)
    const attacksResults = await Promise.all(enemyActivations);
    // You can log/process attacksResults if needed
    // ...existing code...
    combatState.phase = 'PLAYER_TURN';
    return combatState;
  }

  public async applyDamage(
    characterId: string,
    targetId: string,
    attackDiceResult: DiceResultDto,
  ): Promise<AttackResponseDto> {
    const combatState = await this.combatService.getCombatState(characterId);
    if (!combatState) throw new NotFoundException('No combat state found');

    const target = combatState.enemies.find(e => e.id.toLowerCase() === (targetId || '').toLowerCase());
    if (!target) {
      const validTargets = await this.combatService.getValidTargets(characterId);
      throw new BadRequestException(`Invalid target: ${targetId}. Valid targets: ${validTargets.join(', ')}`);
    }

    const isCrit = this.isCritical(attackDiceResult);

    const {
      baseDamage, extraDamage,
    } = this.rollDamageDiceForPlayer(combatState, isCrit);

    const damageTotal = this.computeDamageTotal(baseDamage, extraDamage, combatState.player.damageBonus);

    const combatDamageDiceResult = this.buildCombatDiceResult(baseDamage, isCrit, damageTotal);

    // Apply and persist effects
    await this.persistAndConsumeAction(combatState, target, damageTotal);

    // Optionally finalize combat and retrieve updated state
    const finalState = await this.finalizeCombatIfNeeded(characterId, combatState);

    return {
      combatState: finalState,
      diceResult: attackDiceResult,
      damageDiceResult: combatDamageDiceResult,
      damageTotal,
      isCrit,
    };
  }

  // Private helpers
  private isCritical(attackDiceResult: DiceResultDto): boolean {
    const firstRoll = attackDiceResult.rolls && attackDiceResult.rolls.length ? attackDiceResult.rolls[0] : null;
    return firstRoll === 20;
  }

  private rollDamageDiceForPlayer(combatState: CombatStateDto, isCrit: boolean): { baseDamage: DiceResultDto;
    extraDamage?: DiceResultDto; } {
    const baseDamage = this.diceService.rollDiceExpr(combatState.player.damageDice);
    const extraDamage = isCrit ? this.diceService.rollDiceExpr(combatState.player.damageDice) : undefined;
    return {
      baseDamage,
      extraDamage,
    };
  }

  private computeDamageTotal(base?: DiceResultDto, extra?: DiceResultDto, damageBonus = 0): number {
    const totalFrom = (diceResultParam?: DiceResultDto): number => {
      if (!diceResultParam) return 0;
      if (typeof diceResultParam.total === 'number') return diceResultParam.total;
      if (Array.isArray(diceResultParam.rolls) && diceResultParam.rolls.length) {
        return diceResultParam.rolls.reduce((sum, value) => sum + value, 0);
      }
      return 0;
    };

    return totalFrom(base) + totalFrom(extra) + (damageBonus ?? 0);
  }

  private buildCombatDiceResult(baseDamage: DiceResultDto, isCrit: boolean, damageTotal: number): CombatDiceResultDto {
    return {
      ...baseDamage,
      isCrit,
      damageTotal,
    };
  }

  private async persistAndConsumeAction(combatState: CombatStateDto, target: any, damageTotal: number): Promise<void> {
    target.hp = Math.max(0, (target.hp ?? 0) - damageTotal);
    await this.combatService.saveCombatState(combatState);
    this.combatService.decrementAction(combatState);
  }

  private async finalizeCombatIfNeeded(characterId: string, combatState: CombatStateDto): Promise<CombatStateDto> {
    const anyAlive = combatState.enemies.some(e => e.hp > 0);
    if (!anyAlive) {
      await this.combatService.endCombat(characterId);
      return this.combatService.getCombatState(characterId);
    }
    return combatState;
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
      validTargets: await this.combatService.getValidTargets(characterId),
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
}
