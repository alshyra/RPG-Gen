import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CombatActionRequestDto } from "../../bounded-contexts/combat/api/dto/response/CombatActionRequestDto.js";
import {
  CombatActionResponseDto,
  ActionCost,
} from "../../bounded-contexts/combat/api/dto/response/CombatActionResponseDto.js";
import { CombatSession } from "../../bounded-contexts/combat/infrastructure/persistence/mongo/schemas/CombatSession.js";
import { Combatant } from "../../bounded-contexts/combat/infrastructure/persistence/mongo/schemas/Combatant.js";
import { Aptitude } from "../../bounded-contexts/game-data/domain/aptitude/entities/Aptitude.js";
import { AptitudeDataService } from "../../bounded-contexts/game-data/application/services/AptitudeDataService.js";

/**
 * Orchestrator for unified combat actions via aptitudes.
 * All combat actions (attack, heal, buff, movement) are aptitudes with PA cost.
 */
@Injectable()
export class CombatActionOrchestrator {
  private readonly logger = new Logger(CombatActionOrchestrator.name);

  constructor(
    @InjectModel(CombatSession.name) private readonly combatSessionModel: Model<CombatSession>,
    private readonly aptitudeService: AptitudeDataService,
  ) {}

  /**
   * Execute a combat action - all actions are now aptitudes
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

    // All actions are aptitudes now - execute aptitude usage
    return this.executeUseAptitude(session, request, userId, characterId);
  }

  /**
   * Execute aptitude usage with PA cost, cooldown, and effects
   */
  private async executeUseAptitude(
    session: CombatSession,
    request: CombatActionRequestDto,
    userId: string,
    characterId: string,
  ): Promise<CombatActionResponseDto> {
    // 1. Validate aptitudeId
    if (!request.aptitudeId) {
      throw new BadRequestException("Aptitude ID is required for all combat actions");
    }

    // 2. Load aptitude from database
    const aptitude = await this.aptitudeService.findById(request.aptitudeId);
    if (!aptitude) {
      return new CombatActionResponseDto({
        success: false,
        cost: ActionCost.ACTION,
        errorMessage: `Aptitude not found: ${request.aptitudeId}`,
      });
    }

    // 3. Check PA cost
    const playerPa = session.player?.pa ?? 0;
    const paCost = aptitude.paCost ?? 0;
    
    if (playerPa < paCost) {
      return new CombatActionResponseDto({
        success: false,
        cost: ActionCost.ACTION,
        errorMessage: `Not enough PA (need ${paCost}, have ${playerPa})`,
      });
    }

    // 4. Check cooldown
    const currentTurn = session.currentTurn ?? 1;
    const cooldowns = session.aptitudeCooldowns || new Map();
    const cooldownUntil = cooldowns.get(request.aptitudeId) ?? 0;
    
    if (currentTurn < cooldownUntil) {
      return new CombatActionResponseDto({
        success: false,
        cost: ActionCost.ACTION,
        errorMessage: `Aptitude on cooldown (available turn ${cooldownUntil})`,
      });
    }

    // 5. Execute aptitude effect based on category
    let result: CombatActionResponseDto;
    
    if (aptitude.basePower && aptitude.targetType === "enemy") {
      // Damage aptitude (attack, offensive spell)
      result = await this.executeDamageAptitude(session, aptitude, request, userId, characterId);
    } else if (aptitude.effectType === "heal" && aptitude.basePower > 0) {
      // Healing aptitude
      result = await this.executeHealAptitude(session, aptitude, request, userId, characterId);
    } else if (aptitude.effectType === "buff") {
      // Buff/shield aptitude
      result = await this.executeBuffAptitude(session, aptitude, request, userId, characterId);
    } else if (aptitude.moveType) {
      // Movement aptitude (dash, teleport, etc.)
      result = await this.executeMovementAptitude(session, aptitude, request, userId, characterId);
    } else {
      // Generic/unsupported aptitude type
      result = new CombatActionResponseDto({
        success: false,
        cost: ActionCost.ACTION,
        errorMessage: `Aptitude type not yet implemented: ${aptitude.effectType || "unknown"}`,
      });
    }

    // 6. Deduct PA and apply cooldown if successful
    if (result.success) {
      const newPa = Math.max(0, playerPa - paCost);
      await this.combatSessionModel.findOneAndUpdate(
        { characterId, userId },
        { 
          $set: { 
            "player.pa": newPa,
            [`aptitudeCooldowns.${request.aptitudeId}`]: 
              aptitude.cooldown ? currentTurn + aptitude.cooldown : 0,
            currentTurn: currentTurn,
          } 
        },
      );

      this.logger.debug(
        `Aptitude ${aptitude.name} used. PA: ${playerPa} -> ${newPa}. ` +
        `Cooldown until turn ${aptitude.cooldown ? currentTurn + aptitude.cooldown : "none"}`
      );
    }

    return result;
  }

  /**
   * Calculate Manhattan distance between two positions on the grid
   */
  private calculateDistance(
    pos1?: { x: number; y: number },
    pos2?: { x: number; y: number },
  ): number {
    // If positions not set, assume melee range (1)
    if (!pos1 || !pos2) return 1;
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  /**
   * Get all enemies in area of effect
   */
  private getTargetsInArea(
    session: CombatSession,
    centerPos: { x: number; y: number },
    radius: number,
  ): Combatant[] {
    if (radius === 0) return [];
    
    return session.enemies.filter(enemy => {
      if (!enemy.position) return false;
      const distance = this.calculateDistance(centerPos, enemy.position);
      return distance <= radius && (enemy.hp ?? 0) > 0;
    });
  }

  /**
   * Execute damage aptitude (attack, offensive spell) - always hits, no AC
   */
  private async executeDamageAptitude(
    session: CombatSession,
    aptitude: Aptitude,
    request: CombatActionRequestDto,
    userId: string,
    characterId: string,
  ): Promise<CombatActionResponseDto> {
    const basePower = aptitude.basePower ?? 5;
    const scaledPower = this.aptitudeService.calculateScaledPower(basePower, session.player.hp ?? 1);
    // Parse area shape to get radius (e.g., 'circle_2' -> 2)
    const areaRadius = aptitude.area ? parseInt(aptitude.area.split('_')[1] || '0', 10) : 0;

    let targets: Combatant[] = [];
    let centerPosition: { x: number; y: number } | undefined;

    // Determine targets based on area of effect
    if (areaRadius > 0 && aptitude.area) {
      // Area of effect - use target position as center
      if (!request.targetId) {
        return new CombatActionResponseDto({
          success: false,
          cost: ActionCost.ACTION,
          errorMessage: "Target position required for area aptitude",
        });
      }
      
      const centerEnemy = session.enemies.find(e => e.id === request.targetId);
      if (!centerEnemy?.position) {
        return new CombatActionResponseDto({
          success: false,
          cost: ActionCost.ACTION,
          errorMessage: "Target position not found",
        });
      }
      
      centerPosition = centerEnemy.position;
      targets = this.getTargetsInArea(session, centerPosition, areaRadius);
      
      if (targets.length === 0) {
        return new CombatActionResponseDto({
          success: false,
          cost: ActionCost.ACTION,
          errorMessage: "No valid targets in area",
        });
      }
    } else {
      // Single target
      if (!request.targetId) {
        return new CombatActionResponseDto({
          success: false,
          cost: ActionCost.ACTION,
          errorMessage: "Target required for damage aptitude",
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
      
      targets = [enemy];
      centerPosition = enemy.position;
    }

    // Check range from player to center position
    const range = aptitude.range ?? 1;
    const distance = this.calculateDistance(session.player.position, centerPosition);
    
    if (distance > range) {
      return new CombatActionResponseDto({
        success: false,
        cost: ActionCost.ACTION,
        errorMessage: `Target out of range (${distance} > ${range})`,
      });
    }

    // Apply damage to all targets (no AC check - always hits)
    let totalDamage = 0;
    const damageResults: Array<{ targetName: string; damage: number }> = [];

    for (const target of targets) {
      // Roll damage for each target
      const damageRoll = Math.floor(Math.random() * scaledPower) + 1;
      const damage = damageRoll;
      
      // Apply damage
      target.hp = Math.max(0, (target.hp ?? 0) - damage);
      totalDamage += damage;
      damageResults.push({ targetName: target.name, damage });
      
      await this.combatSessionModel.findOneAndUpdate(
        { characterId, userId, "enemies.id": target.id },
        { $set: { "enemies.$.hp": target.hp } },
      );
    }

    // Check combat end
    await this.checkAndEndCombatIfNeeded(characterId, userId);

    // Build description
    let description: string;
    if (targets.length === 1) {
      description = `${aptitude.name}: ${targets[0].name} takes ${damageResults[0].damage} damage`;
    } else {
      const targetSummary = damageResults
        .map(r => `${r.targetName} (${r.damage})`)
        .join(", ");
      description = `${aptitude.name}: Hit ${targets.length} targets - ${targetSummary}`;
    }

    return new CombatActionResponseDto({
      success: true,
      cost: ActionCost.ACTION,
      damage: totalDamage,
      description,
      damageTotal: totalDamage,
    });
  }

  /**
   * Execute healing aptitude
   */
  private async executeHealAptitude(
    session: CombatSession,
    aptitude: Aptitude,
    request: CombatActionRequestDto,
    userId: string,
    characterId: string,
  ): Promise<CombatActionResponseDto> {
    const targetId = request.targetId || session.player.id;
    const isPlayerTarget = targetId === session.player.id;
    
    if (!isPlayerTarget) {
      // TODO: Handle ally healing when party system exists
      return new CombatActionResponseDto({
        success: false,
        cost: ActionCost.ACTION,
        errorMessage: "Ally healing not yet implemented",
      });
    }

    // Calculate heal amount
    const basePower = aptitude.basePower ?? 5;
    const healAmount = this.aptitudeService.calculateScaledPower(basePower, session.player.hp ?? 1);
    
    // Apply heal
    const currentHp = session.player.hp ?? 0;
    const maxHp = session.player.hpMax ?? currentHp;
    const newHp = Math.min(maxHp, currentHp + healAmount);
    
    await this.combatSessionModel.findOneAndUpdate(
      { characterId, userId },
      { $set: { "player.hp": newHp } },
    );

    return new CombatActionResponseDto({
      success: true,
      cost: ActionCost.ACTION,
      description: `${aptitude.name}: Healed ${newHp - currentHp} HP`,
    });
  }

  /**
   * Execute buff/shield aptitude
   */
  private async executeBuffAptitude(
    session: CombatSession,
    aptitude: Aptitude,
    request: CombatActionRequestDto,
    userId: string,
    characterId: string,
  ): Promise<CombatActionResponseDto> {
    // Add buff to active effects
    const buffId = `buff_${aptitude.id}_${Date.now()}`;
    const activeEffects = session.activeEffects || [];
    activeEffects.push(buffId);
    
    await this.combatSessionModel.findOneAndUpdate(
      { characterId, userId },
      { $set: { activeEffects } },
    );

    return new CombatActionResponseDto({
      success: true,
      cost: ActionCost.ACTION,
      description: `${aptitude.name}: Buff applied`,
    });
  }

  /**
   * Execute movement aptitude (dash, teleport)
   */
  private async executeMovementAptitude(
    session: CombatSession,
    aptitude: Aptitude,
    request: CombatActionRequestDto,
    userId: string,
    characterId: string,
  ): Promise<CombatActionResponseDto> {
    // TODO: Implement position-based movement when grid system is ready
    // For now, just add movement effect
    const moveEffect = `move_${aptitude.moveType}_${Date.now()}`;
    const activeEffects = session.activeEffects || [];
    activeEffects.push(moveEffect);
    
    await this.combatSessionModel.findOneAndUpdate(
      { characterId, userId },
      { $set: { activeEffects } },
    );

    return new CombatActionResponseDto({
      success: true,
      cost: ActionCost.ACTION,
      description: `${aptitude.name}: Movement executed`,
    });
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
}
