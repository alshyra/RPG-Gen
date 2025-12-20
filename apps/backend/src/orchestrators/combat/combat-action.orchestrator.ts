import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  CombatActionRequestDto,
  CombatActionType,
} from "../../domain/combat/dto/CombatActionRequestDto.js";
import {
  CombatActionResponseDto,
  ActionCost,
} from "../../domain/combat/dto/CombatActionResponseDto.js";
import { CombatSession } from "../../infra/mongo/combat/CombatSession.js";
import { DiceService } from "../../domain/dice/dice.service.js";

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
      throw new BadRequestException("No active combat session");
    }

    // Determine action cost
    const cost = this.getActionCost(request.actionType);

    // Validate action economy
    if (cost === ActionCost.ACTION && (session.actionRemaining ?? 0) <= 0) {
      return new CombatActionResponseDto({
        success: false,
        cost,
        errorMessage: "No actions remaining",
      });
    }
    if (cost === ActionCost.BONUS_ACTION && (session.bonusActionRemaining ?? 0) <= 0) {
      return new CombatActionResponseDto({
        success: false,
        cost,
        errorMessage: "No bonus actions remaining",
      });
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

  /**
   * Helper to check if all enemies are dead and end combat if so
   */
  private async checkAndEndCombatIfNeeded(characterId: string, userId: string): Promise<boolean> {
    const updatedSession = await this.combatSessionModel.findOne({ characterId, userId }).exec();

    if (!updatedSession) return false;

    const allEnemiesDead = updatedSession.enemies.every(e => (e.hp ?? 0) <= 0);
    if (!allEnemiesDead) return false;

    // End combat: set inCombat flag to false and cleanup
    updatedSession.inCombat = false;
    await updatedSession.save();
    this.logger.log(`Combat ended: all enemies defeated for character ${characterId}`);
    return true;
  }

  private async executeAttack(
    session: CombatSession,
    request: CombatActionRequestDto,
    userId: string,
    characterId: string,
  ): Promise<CombatActionResponseDto> {
    if (!request.targetId) {
      return new CombatActionResponseDto({
        success: false,
        cost: ActionCost.ACTION,
        errorMessage: "Target ID required for attack",
      });
    }

    const enemy = session.enemies.find(e => e.id === request.targetId);
    if (!enemy) {
      return new CombatActionResponseDto({
        success: false,
        cost: ActionCost.ACTION,
        errorMessage: "Target not found",
      });
    }

    // Get player's attack bonus from session (combat service sets this on combat start)
    const playerAttackBonus = session.player?.attackBonus ?? 4;
    const playerDamageDice = session.player?.damageDice ?? "1d8";
    const playerDamageBonus = session.player?.damageBonus ?? 3;

    // Roll attack using DiceService
    const attackRoll = this.diceService.rollAttack(playerAttackBonus, enemy.ac ?? 10);
    const hit = attackRoll.hit;
    const isCrit = attackRoll.isCrit;

    let damage = 0;
    const damageResult = this.diceService.rollDamage(playerDamageDice, isCrit, playerDamageBonus);
    if (hit) {
      damage = damageResult.damageTotal;
      enemy.hp = Math.max(0, (enemy.hp ?? 0) - damage);
      await this.combatSessionModel.findOneAndUpdate(
        { characterId, userId, "enemies.id": enemy.id },
        { $set: { "enemies.$.hp": enemy.hp } },
      );

      // Check if all enemies are dead (combat end condition)
      await this.checkAndEndCombatIfNeeded(characterId, userId);
    }

    return new CombatActionResponseDto({
      success: true,
      cost: ActionCost.ACTION,
      hit,
      damage: hit ? damage : undefined,
      description: hit
        ? `Hit ${enemy.name} for ${damage} damage${isCrit ? " (CRITICAL!)" : ""}`
        : `Missed ${enemy.name}`,
      diceResult: attackRoll.diceResult,
      damageDiceResult: damageResult,
      damageTotal: damage,
      isCrit,
    });
  }

  private async executeDash(
    session: CombatSession,
    userId: string,
    characterId: string,
  ): Promise<CombatActionResponseDto> {
    // Add 'dashed' effect for current turn (doubles movement)
    if (!session.activeEffects) session.activeEffects = [];
    if (!session.activeEffects.includes("dashed")) {
      session.activeEffects.push("dashed");
      await this.combatSessionModel.findOneAndUpdate(
        { characterId, userId },
        { $set: { activeEffects: session.activeEffects } },
      );
    }

    return new CombatActionResponseDto({
      success: true,
      cost: ActionCost.ACTION,
      description: "You take the Dash action, doubling your movement speed for this turn",
    });
  }

  private async executeDisengage(
    session: CombatSession,
    userId: string,
    characterId: string,
  ): Promise<CombatActionResponseDto> {
    // Add 'disengaged' effect for current turn (no OAs)
    if (!session.activeEffects) session.activeEffects = [];
    if (!session.activeEffects.includes("disengaged")) {
      session.activeEffects.push("disengaged");
      await this.combatSessionModel.findOneAndUpdate(
        { characterId, userId },
        { $set: { activeEffects: session.activeEffects } },
      );
    }

    return new CombatActionResponseDto({
      success: true,
      cost: ActionCost.BONUS_ACTION,
      description: "You disengage, avoiding opportunity attacks for this turn",
    });
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
}
