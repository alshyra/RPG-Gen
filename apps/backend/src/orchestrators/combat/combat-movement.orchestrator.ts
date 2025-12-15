import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { CombatAppService } from "../../domain/combat/combat.app.service.js";
import { GridPositionDto } from "../../domain/combat/dto/GridPositionDto.js";
import { MovementEventDto, MovementEventType } from "../../domain/combat/dto/MovementEventDto.js";
import { MovementRequestDto } from "../../domain/combat/dto/MovementRequestDto.js";
import { MovementResponseDto } from "../../domain/combat/dto/MovementResponseDto.js";
import { CombatGridService } from "../../domain/combat/services/combat-grid.service.js";
import {
  CombatantStats,
  OpportunityAttackResolver,
} from "../../domain/combat/services/opportunity-attack.service.js";

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
      const combatState = await this.combatService.getCombatState(characterId);
      const activeEffects = combatState.activeEffects ?? [];

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
          remainingMovement: 0,
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

      // Add movement event
      events.unshift({
        type: MovementEventType.MOVE,
        actorId: request.combatantId,
        description: `Moved to (${finalPosition.x}, ${finalPosition.y})`,
      });

      // Calculate remaining movement
      const distance = request.path.length - 1;
      const combatantPos = positions.find(p => p.combatantId === request.combatantId);
      const baseSpeed = combatantPos?.speed ?? 30;
      const hasDashed = activeEffects.includes("dashed");
      const maxMovement = hasDashed ? baseSpeed * 2 : baseSpeed;
      const remainingMovement = maxMovement - distance;

      return {
        success: true,
        finalPosition,
        events,
        remainingMovement: Math.max(0, remainingMovement),
      };
    } catch (error) {
      this.logger.error(`Movement failed for ${request.combatantId}:`, error);
      throw new BadRequestException("Movement execution failed");
    }
  }
}
