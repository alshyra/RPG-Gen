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
  CombatEnemyDto,
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
  ): Promise<CombatStateDto> {
    const characterDto = await this.characterService.findByCharacterId(userId, characterId);
    const state = await this.combatService.initializeCombat(characterDto, combatStartRequest, userId);

    this.logger.log(`Combat started for character ${characterId} with ${combatStartRequest.combat_start.length} enemies`);

    return {
      ...state,
      narrative: (await this.combatService.getCombatSummary(characterId)) ?? undefined,
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

    // DiceService now exposes rollAttack that encapsulates the 1d20 logic (+crit/fumble)
    const attackRoll = this.diceService.rollAttack(combatState.player.attackBonus, targetEnemy.ac);

    if (!attackRoll.hit) {
      this.combatService.decrementAction(combatState);
      return {
        combatState,
        diceResult: attackRoll.diceResult,
      };
    }

    // Hit: roll damage via DiceService (handles crit doubling) and get the damage result DTO
    const damageResult = this.diceService.rollDamage(combatState.player.damageDice, attackRoll.isCrit, combatState.player.damageBonus);

    // Apply damage and finalize via CombatService (persist, consume action, maybe end combat)
    const finalState = await this.combatService.applyPlayerDamage(characterId, targetEnemy.id, damageResult.damageTotal);

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
