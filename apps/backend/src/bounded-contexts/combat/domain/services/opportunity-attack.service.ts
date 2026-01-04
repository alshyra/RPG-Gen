import { Injectable, Logger } from "@nestjs/common";
import { CombatGridService } from "./combat-grid.service.js";
import { GridPositionDto } from "../../api/dto/response/GridPositionDto.js";
import { MovementEventDto, MovementEventType } from "../../api/dto/response/MovementEventDto.js";
import { DiceService } from "../../../game-narrative/domain/dice/DiceService.js";

export interface CombatantStats {
  id: string;
  attackBonus: number;
  damageDice: string;
  damageBonus: number;
}

/**
 * Service for resolving opportunity attacks during movement
 */
@Injectable()
export class OpportunityAttackResolver {
  private readonly logger = new Logger(OpportunityAttackResolver.name);

  constructor(
    private readonly gridService: CombatGridService,
    private readonly diceService: DiceService,
  ) {}

  /**
   * Detect and resolve opportunity attacks along a movement path
   * @param activeEffects - Active turn effects from combat state (e.g., ['dashed', 'disengaged'])
   */
  resolveOpportunityAttacks(
    combatId: string,
    combatantId: string,
    path: GridPositionDto[],
    activeEffects: string[],
    combatantStats: Map<string, CombatantStats>,
  ): MovementEventDto[] {
    const events: MovementEventDto[] = [];

    // Disengage prevents opportunity attacks
    if (activeEffects.includes("disengaged")) {
      this.logger.debug(`Combatant ${combatantId} disengaged, no OA checks`);
      return events;
    }

    const allPositions = this.gridService.getAllPositions(combatId);
    const movingCombatant = combatantStats.get(combatantId);
    if (!movingCombatant) {
      return events;
    }

    // Check each step in the path for OA triggers
    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1];
      const to = path[i];

      // Find all hostile combatants that have the mover in reach at 'from' but not at 'to'
      for (const position of allPositions) {
        if (position.combatantId === combatantId || !position.isHostile) {
          continue;
        }

        const wasInReach = this.gridService.isInReach(combatId, position.combatantId, from);
        const stillInReach = this.gridService.isInReach(combatId, position.combatantId, to);

        // OA triggers when leaving reach
        if (wasInReach && !stillInReach) {
          this.logger.debug(
            `OA triggered by ${position.combatantId} against ${combatantId} at step ${i}`,
          );

          const attacker = combatantStats.get(position.combatantId);
          if (!attacker) {
            continue;
          }

          // Resolve the opportunity attack
          const oaEvent = this.resolveAttack(
            attacker,
            movingCombatant,
            combatantId,
            position.combatantId,
          );
          events.push(oaEvent);
        }
      }
    }

    return events;
  }

  /**
   * Resolve a single opportunity attack
   */
  private resolveAttack(
    attacker: CombatantStats,
    defender: CombatantStats,
    defenderId: string,
    attackerId: string,
  ): MovementEventDto {
    const damageRoll = this.diceService.rollDiceExpr(attacker.damageDice);
    const damage = damageRoll.total + attacker.damageBonus;
    // TODO: implement damage reduction someday
    return {
      type: MovementEventType.OPPORTUNITY_ATTACK,
      actorId: attackerId,
      targetId: defenderId,
      damage,
      description: `${attackerId} hits with opportunity attack for ${damage} damage`,
    };
  }
}
