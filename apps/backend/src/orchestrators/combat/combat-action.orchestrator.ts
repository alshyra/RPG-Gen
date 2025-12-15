import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CombatActionRequestDto,
  CombatActionType,
} from '../../domain/combat/dto/CombatActionRequestDto.js';
import {
  CombatActionResponseDto,
  ActionCost,
} from '../../domain/combat/dto/CombatActionResponseDto.js';
import { CombatSession } from '../../infra/mongo/combat/CombatSession.js';
import { DiceService } from '../../domain/dice/dice.service.js';

/**
 * Orchestrator for unified combat actions.
 * Handles all combat actions: attack, dash, disengage, spells, class features, etc.
 */
@Injectable()
export class CombatActionOrchestrator {
  private readonly logger = new Logger(CombatActionOrchestrator.name);

  constructor(
    @InjectModel(CombatSession.name) private readonly combatSessionModel: Model<CombatSession>,
    private readonly diceService: DiceService,
  ) {}

  /**
   * Execute a combat action with automatic action economy validation
   */
  async executeAction(
    userId: string,
    characterId: string,
    request: CombatActionRequestDto,
  ): Promise<CombatActionResponseDto> {
    const session = await this.combatSessionModel.findOne({ characterId, userId }).exec();
    if (!session) {
      throw new BadRequestException('No active combat session');
    }

    // Determine action cost
    const cost = this.getActionCost(request.actionType);

    // Validate action economy
    if (cost === ActionCost.ACTION && (session.actionRemaining ?? 0) <= 0) {
      return this.failureResponse(cost, 'No actions remaining', session);
    }
    if (cost === ActionCost.BONUS_ACTION && (session.bonusActionRemaining ?? 0) <= 0) {
      return this.failureResponse(cost, 'No bonus actions remaining', session);
    }

    // Execute the specific action
    let result: CombatActionResponseDto;
    switch (request.actionType) {
      case CombatActionType.ATTACK:
        result = await this.executeAttack(session, request, userId, characterId);
        break;
      case CombatActionType.DASH:
        result = await this.executeDash(session, userId, characterId);
        break;
      case CombatActionType.DISENGAGE:
        result = await this.executeDisengage(session, userId, characterId);
        break;
      case CombatActionType.CAST_SPELL:
        result = await this.executeCastSpell(session, request, userId, characterId);
        break;
      case CombatActionType.SECOND_WIND:
        result = await this.executeSecondWind(session, userId, characterId);
        break;
      default:
        throw new BadRequestException(`Action type ${request.actionType} not implemented`);
    }

    // Deduct action cost if successful
    if (result.success) {
      await this.deductActionCost(session, cost, userId, characterId);
    }

    return result;
  }

  private getActionCost(actionType: CombatActionType): ActionCost {
    switch (actionType) {
      case CombatActionType.ATTACK:
      case CombatActionType.DASH:
      case CombatActionType.CAST_SPELL:
        return ActionCost.ACTION;
      case CombatActionType.DISENGAGE:
      case CombatActionType.CUNNING_ACTION:
      case CombatActionType.SECOND_WIND:
        return ActionCost.BONUS_ACTION;
      default:
        return ActionCost.ACTION;
    }
  }

  private async executeAttack(
    session: CombatSession,
    request: CombatActionRequestDto,
    userId: string,
    characterId: string,
  ): Promise<CombatActionResponseDto> {
    if (!request.targetId) {
      return this.failureResponse(ActionCost.ACTION, 'Target ID required for attack', session);
    }

    const enemy = session.enemies.find(e => e.id === request.targetId);
    if (!enemy) {
      return this.failureResponse(ActionCost.ACTION, 'Target not found', session);
    }

    // Use existing attack logic from combat service
    const attackRoll = this.diceService.rollDiceExpr('1d20');
    const playerAttackBonus = 4; // TODO: Get from character
    const totalAttack = attackRoll.total + playerAttackBonus;
    const hit = totalAttack >= (enemy.ac ?? 10);

    let damage = 0;
    if (hit) {
      const damageRoll = this.diceService.rollDiceExpr('1d8');
      damage = damageRoll.total + 3; // TODO: Get modifier from character
      enemy.hp = Math.max(0, (enemy.hp ?? 0) - damage);
      await this.combatSessionModel.findOneAndUpdate(
        { characterId, userId, 'enemies.id': enemy.id },
        { $set: { 'enemies.$.hp': enemy.hp } },
      );
    }

    return {
      success: true,
      cost: ActionCost.ACTION,
      hit,
      damage: hit ? damage : undefined,
      description: hit ? `Hit ${enemy.name} for ${damage} damage` : `Missed ${enemy.name}`,
      actionsRemaining: session.actionRemaining ?? 0,
      bonusActionsRemaining: session.bonusActionRemaining ?? 0,
      activeEffects: session.activeEffects ?? [],
    };
  }

  private async executeDash(
    session: CombatSession,
    userId: string,
    characterId: string,
  ): Promise<CombatActionResponseDto> {
    // Add 'dashed' effect for current turn (doubles movement)
    if (!session.activeEffects) session.activeEffects = [];
    if (!session.activeEffects.includes('dashed')) {
      session.activeEffects.push('dashed');
      await this.combatSessionModel.findOneAndUpdate(
        { characterId, userId },
        { $set: { activeEffects: session.activeEffects } },
      );
    }

    return {
      success: true,
      cost: ActionCost.ACTION,
      description: 'You take the Dash action, doubling your movement speed for this turn',
      actionsRemaining: session.actionRemaining ?? 0,
      bonusActionsRemaining: session.bonusActionRemaining ?? 0,
      activeEffects: session.activeEffects,
    };
  }

  private async executeDisengage(
    session: CombatSession,
    userId: string,
    characterId: string,
  ): Promise<CombatActionResponseDto> {
    // Add 'disengaged' effect for current turn (no OAs)
    if (!session.activeEffects) session.activeEffects = [];
    if (!session.activeEffects.includes('disengaged')) {
      session.activeEffects.push('disengaged');
      await this.combatSessionModel.findOneAndUpdate(
        { characterId, userId },
        { $set: { activeEffects: session.activeEffects } },
      );
    }

    return {
      success: true,
      cost: ActionCost.BONUS_ACTION,
      description: 'You disengage, avoiding opportunity attacks for this turn',
      actionsRemaining: session.actionRemaining ?? 0,
      bonusActionsRemaining: session.bonusActionRemaining ?? 0,
      activeEffects: session.activeEffects,
    };
  }

  private async executeCastSpell(
    session: CombatSession,
    request: CombatActionRequestDto,
    userId: string,
    characterId: string,
  ): Promise<CombatActionResponseDto> {
    if (!request.spellName) {
      return this.failureResponse(ActionCost.ACTION, 'Spell name required', session);
    }

    // TODO: Implement spell casting logic
    return this.failureResponse(ActionCost.ACTION, 'Spell casting not yet implemented', session);
  }

  private async executeSecondWind(
    session: CombatSession,
    userId: string,
    characterId: string,
  ): Promise<CombatActionResponseDto> {
    // TODO: Implement second wind healing
    const healing = 10; // Placeholder
    const newHp = Math.min((session.player.hp ?? 0) + healing, session.player.hpMax ?? 20);
    await this.combatSessionModel.findOneAndUpdate(
      { characterId, userId },
      { $set: { 'player.hp': newHp } },
    );

    return {
      success: true,
      cost: ActionCost.BONUS_ACTION,
      healing,
      description: `You use Second Wind, regaining ${healing} HP`,
      actionsRemaining: session.actionRemaining ?? 0,
      bonusActionsRemaining: session.bonusActionRemaining ?? 0,
      activeEffects: session.activeEffects ?? [],
    };
  }

  private async deductActionCost(
    session: CombatSession,
    cost: ActionCost,
    userId: string,
    characterId: string,
  ): Promise<void> {
    if (cost === ActionCost.ACTION) {
      await this.combatSessionModel.findOneAndUpdate(
        { characterId, userId },
        { $set: { actionRemaining: Math.max(0, (session.actionRemaining ?? 1) - 1) } },
      );
    } else if (cost === ActionCost.BONUS_ACTION) {
      await this.combatSessionModel.findOneAndUpdate(
        { characterId, userId },
        { $set: { bonusActionRemaining: Math.max(0, (session.bonusActionRemaining ?? 1) - 1) } },
      );
    }
  }

  private failureResponse(
    cost: ActionCost,
    errorMessage: string,
    session: CombatSession,
  ): CombatActionResponseDto {
    return {
      success: false,
      cost,
      errorMessage,
      actionsRemaining: session.actionRemaining ?? 0,
      bonusActionsRemaining: session.bonusActionRemaining ?? 0,
      activeEffects: session.activeEffects ?? [],
    };
  }
}
