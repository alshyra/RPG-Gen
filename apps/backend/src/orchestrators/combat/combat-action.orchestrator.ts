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
import { SpellDefinitionService } from "../../domain/spell-definition/spell-definition.service.js";
import { CharacterService } from "../../domain/character/character.service.js";
import { CombatAppService } from "../../domain/combat/combat.app.service.js";

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
    private readonly spellDefinitionService: SpellDefinitionService,
    private readonly characterService: CharacterService,
    private readonly combatAppService: CombatAppService,
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
      return this.failureResponse(cost, "No actions remaining", session);
    }
    if (cost === ActionCost.BONUS_ACTION && (session.bonusActionRemaining ?? 0) <= 0) {
      return this.failureResponse(cost, "No bonus actions remaining", session);
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

  /**
   * Helper to check if all enemies are dead and end combat if so
   */
  private async checkAndEndCombatIfNeeded(characterId: string, userId: string): Promise<boolean> {
    const updatedSession = await this.combatSessionModel.findOne({ characterId, userId }).exec();
    if (updatedSession) {
      const allEnemiesDead = updatedSession.enemies.every((e: any) => (e.hp ?? 0) <= 0);
      if (allEnemiesDead) {
        // End combat: set inCombat flag to false and cleanup
        updatedSession.inCombat = false;
        await updatedSession.save();
        this.logger.log(`Combat ended: all enemies defeated for character ${characterId}`);
        return true;
      }
    }
    return false;
  }

  private async executeAttack(
    session: CombatSession,
    request: CombatActionRequestDto,
    userId: string,
    characterId: string,
  ): Promise<CombatActionResponseDto> {
    if (!request.targetId) {
      return this.failureResponse(ActionCost.ACTION, "Target ID required for attack", session);
    }

    const enemy = session.enemies.find(e => e.id === request.targetId);
    if (!enemy) {
      return this.failureResponse(ActionCost.ACTION, "Target not found", session);
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
    let damageResult;
    if (hit) {
      damageResult = this.diceService.rollDamage(playerDamageDice, isCrit, playerDamageBonus);
      damage = damageResult.damageTotal;
      enemy.hp = Math.max(0, (enemy.hp ?? 0) - damage);
      await this.combatSessionModel.findOneAndUpdate(
        { characterId, userId, "enemies.id": enemy.id },
        { $set: { "enemies.$.hp": enemy.hp } },
      );

      // Check if all enemies are dead (combat end condition)
      await this.checkAndEndCombatIfNeeded(characterId, userId);
    }

    return {
      success: true,
      cost: ActionCost.ACTION,
      hit,
      damage: hit ? damage : undefined,
      description: hit
        ? `Hit ${enemy.name} for ${damage} damage${isCrit ? " (CRITICAL!)" : ""}`
        : `Missed ${enemy.name}`,
      actionsRemaining: session.actionRemaining ?? 0,
      bonusActionsRemaining: session.bonusActionRemaining ?? 0,
      activeEffects: session.activeEffects ?? [],
      diceResult: attackRoll.diceResult,
      damageDiceResult: damageResult,
      damageTotal: damage,
      isCrit,
    };
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

    return {
      success: true,
      cost: ActionCost.ACTION,
      description: "You take the Dash action, doubling your movement speed for this turn",
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
    if (!session.activeEffects.includes("disengaged")) {
      session.activeEffects.push("disengaged");
      await this.combatSessionModel.findOneAndUpdate(
        { characterId, userId },
        { $set: { activeEffects: session.activeEffects } },
      );
    }

    return {
      success: true,
      cost: ActionCost.BONUS_ACTION,
      description: "You disengage, avoiding opportunity attacks for this turn",
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
      return this.failureResponse(ActionCost.ACTION, "Spell name required", session);
    }

    if (!request.targetId) {
      return this.failureResponse(ActionCost.ACTION, "Target ID required for spell", session);
    }

    // Find target
    const target = session.enemies.find(e => e.id === request.targetId);
    if (!target) {
      return this.failureResponse(ActionCost.ACTION, "Target not found", session);
    }

    // Load spell definition
    const spellDef = await this.spellDefinitionService.findByName(request.spellName);
    if (!spellDef) {
      return this.failureResponse(
        ActionCost.ACTION,
        `Spell not found: ${request.spellName}`,
        session,
      );
    }

    const damageDice = spellDef.meta?.damageDice || "1d4";
    const saveType = spellDef.meta?.saveType;

    // Calculate spell DC (8 + proficiency + spellcasting ability modifier)
    const character = await this.characterService.findByCharacterId(userId, characterId);
    const chaMod = Math.floor(((character.scores?.Cha ?? 10) - 10) / 2);
    const proficiency = character.proficiency ?? 2;
    const spellDC = 8 + proficiency + chaMod;

    let hit = false;
    let isCrit = false;
    let damage = 0;
    let diceResult;
    let damageDiceResult;

    if (saveType) {
      // Saving throw spell
      const savingThrowBonus = -1; // MVP: default bonus
      const saveRoll = this.diceService.rollSave(savingThrowBonus, spellDC);
      hit = !saveRoll.success; // Damage on failed save
      diceResult = saveRoll.diceResult;

      if (hit) {
        damageDiceResult = this.diceService.rollDamage(damageDice, false, 0);
        damage = damageDiceResult.damageTotal;
        target.hp = Math.max(0, (target.hp ?? 0) - damage);
        await this.combatSessionModel.findOneAndUpdate(
          { characterId, userId, "enemies.id": target.id },
          { $set: { "enemies.$.hp": target.hp } },
        );

        // Check if all enemies are dead (combat end condition)
        await this.checkAndEndCombatIfNeeded(characterId, userId);
      }

      return {
        success: true,
        cost: ActionCost.ACTION,
        hit,
        damage: hit ? damage : undefined,
        description: hit
          ? `${request.spellName}: ${target.name} failed save, took ${damage} damage`
          : `${request.spellName}: ${target.name} succeeded on save`,
        actionsRemaining: session.actionRemaining ?? 0,
        bonusActionsRemaining: session.bonusActionRemaining ?? 0,
        activeEffects: session.activeEffects ?? [],
        diceResult,
        damageDiceResult,
        damageTotal: damage,
        isCrit: false,
      };
    } else {
      // Attack roll spell (like fire bolt, ray of frost)
      const spellAttackBonus = proficiency + chaMod;
      const attackRoll = this.diceService.rollAttack(spellAttackBonus, target.ac ?? 0);
      hit = attackRoll.hit;
      isCrit = attackRoll.isCrit;
      diceResult = attackRoll.diceResult;

      if (hit) {
        damageDiceResult = this.diceService.rollDamage(damageDice, isCrit, 0);
        damage = damageDiceResult.damageTotal;
        target.hp = Math.max(0, (target.hp ?? 0) - damage);
        await this.combatSessionModel.findOneAndUpdate(
          { characterId, userId, "enemies.id": target.id },
          { $set: { "enemies.$.hp": target.hp } },
        );

        // Check if all enemies are dead (combat end condition)
        await this.checkAndEndCombatIfNeeded(characterId, userId);
      }

      return {
        success: true,
        cost: ActionCost.ACTION,
        hit,
        damage: hit ? damage : undefined,
        description: hit
          ? `${request.spellName}: Hit ${target.name} for ${damage} damage${isCrit ? " (CRITICAL!)" : ""}`
          : `${request.spellName}: Missed ${target.name}`,
        actionsRemaining: session.actionRemaining ?? 0,
        bonusActionsRemaining: session.bonusActionRemaining ?? 0,
        activeEffects: session.activeEffects ?? [],
        diceResult,
        damageDiceResult,
        damageTotal: damage,
        isCrit,
      };
    }
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
      { $set: { "player.hp": newHp } },
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
