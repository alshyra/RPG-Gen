import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { CombatAppService } from "../../bounded-contexts/combat/application/services/CombatAppService.js";
import { GridPositionDto } from "../../bounded-contexts/combat/api/dto/response/GridPositionDto.js";
import { MovementEventDto, MovementEventType } from "../../bounded-contexts/combat/api/dto/response/MovementEventDto.js";
import { MovementRequestDto } from "../../bounded-contexts/combat/api/dto/response/MovementRequestDto.js";
import { MovementResponseDto } from "../../bounded-contexts/combat/api/dto/response/MovementResponseDto.js";
import { CombatGridService } from "../../bounded-contexts/combat/domain/services/combat-grid.service.js";
import { ActionEconomyService } from "../../bounded-contexts/combat/domain/services/action-economy.service.js";
import {
  CombatantStats,
  OpportunityAttackResolver,
} from "../../bounded-contexts/combat/domain/services/opportunity-attack.service.js";

/**
 * Orchestrator for combat movement operations.
 * Coordinates grid service, OA resolver, and combat state updates.
 */
@Injectable()
export class CombatMovementOrchestrator {
  private readonly logger = new Logger(CombatMovementOrchestrator.name);

  constructor(
    private readonly gridService: CombatGridService,
    private readonly oaResolver: OpportunityAttackResolver,
    private readonly combatService: CombatAppService,
    private readonly actionEconomy: ActionEconomyService,
  ) {}

  /**
   * Execute a movement request with full validation and OA resolution
   */
  async executeMovement(
    userId: string,
    characterId: string,
    request: MovementRequestDto,
  ): Promise<MovementResponseDto> {
    const combatId = characterId; // Using characterId as combatId for now

    try {
      // Fetch active effects from combat state
      let combatState = await this.combatService.getCombatState(characterId);
      const activeEffects = combatState.activeEffects ?? [];

      // Calculate movement cost (path length - 1 since first point is current position)
      const movementCost = request.path.length - 1;
      if (movementCost <= 0) {
        return {
          success: false,
          finalPosition:
            this.gridService.getPosition(combatId, request.combatantId) ??
            new GridPositionDto(0, 0),
          events: [],
          pm: combatState.player?.pm ?? 0,
          errorMessage: "Invalid path: must contain at least 2 points",
        };
      }

      // Check if player has enough PM
      if (!this.actionEconomy.hasEnoughPM(combatState, movementCost)) {
        const currentPM = combatState.player?.pm ?? 0;
        return {
          success: false,
          finalPosition:
            this.gridService.getPosition(combatId, request.combatantId) ??
            new GridPositionDto(0, 0),
          events: [],
          pm: currentPM,
          errorMessage: `Not enough PM: requires ${movementCost}, has ${currentPM}`,
        };
      }

      // Validate path
      const validation = this.gridService.validatePath(
        combatId,
        request.combatantId,
        request.path,
        activeEffects,
      );

      if (!validation.valid) {
        return {
          success: false,
          finalPosition:
            this.gridService.getPosition(combatId, request.combatantId) ??
            new GridPositionDto(0, 0),
          events: [],
          pm: combatState.player?.pm ?? 0,
          errorMessage: validation.error,
        };
      }

      const events: MovementEventDto[] = [];

      // Build combatant stats map for OA resolution
      const positions = this.gridService.getAllPositions(combatId);
      const statsMap = new Map<string, CombatantStats>();

      // Mock stats for now - in production, fetch from combat state
      for (const pos of positions) {
        statsMap.set(pos.combatantId, {
          id: pos.combatantId,
          attackBonus: 4,
          damageDice: "1d6",
          damageBonus: 2,
          ac: 13,
        });
      }

      // Resolve opportunity attacks
      const oaEvents = this.oaResolver.resolveOpportunityAttacks(
        combatId,
        request.combatantId,
        request.path,
        activeEffects,
        statsMap,
      );
      events.push(...oaEvents);

      // Apply movement
      const finalPosition = request.path[request.path.length - 1];
      this.gridService.applyMovement(combatId, request.combatantId, finalPosition);

      // Consume PM via ActionEconomyService
      combatState = this.actionEconomy.consumePM(combatState, movementCost);

      // Update combat state with new position and consumed PM
      const combatant = combatState.player.id === request.combatantId
        ? combatState.player
        : combatState.enemies.find(e => e.id === request.combatantId);
      
      if (combatant) {
        combatant.position = { x: finalPosition.x, y: finalPosition.y };
      }
      
      // Save updated state (position + consumed PM)
      await this.combatService.saveCombatState(combatState);

      // Add movement event
      events.unshift({
        type: MovementEventType.MOVE,
        actorId: request.combatantId,
        description: `Moved to (${finalPosition.x}, ${finalPosition.y}) [${movementCost} PM]`,
      });

      return {
        success: true,
        finalPosition,
        events,
        pm: combatState.player?.pm ?? 0,
      };
    } catch (error) {
      this.logger.error(`Movement failed for ${request.combatantId}:`, error);
      throw new BadRequestException("Movement execution failed");
    }
  }
}
