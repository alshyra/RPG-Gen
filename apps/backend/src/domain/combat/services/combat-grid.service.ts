import { Injectable, Logger } from "@nestjs/common";
import { GridPositionDto } from "../dto/GridPositionDto.js";

export interface CombatantPosition {
  combatantId: string;
  position: GridPositionDto;
  reach: number; // in grid units (typically 1 for melee, 2+ for reach weapons)
  speed: number; // base movement speed
  isHostile: boolean;
}

/**
 * Service managing combat grid state, positions, and movement validation.
 */
@Injectable()
export class CombatGridService {
  private readonly logger = new Logger(CombatGridService.name);

  // In-memory storage of combat grid states (per combat session)
  // In production, this could be moved to database or Redis
  private readonly gridStates = new Map<
    string,
    {
      width: number;
      height: number;
      positions: Map<string, CombatantPosition>;
      occupancy: Map<string, string>; // "x,y" -> combatantId
    }
  >();

  /**
   * Initialize grid for a combat session
   */
  initializeGrid(
    combatId: string,
    width: number,
    height: number,
    combatants: Array<{
      id: string;
      position: GridPositionDto;
      reach?: number;
      speed?: number;
      isHostile: boolean;
    }>,
  ): void {
    const positions = new Map<string, CombatantPosition>();
    const occupancy = new Map<string, string>();

    for (const combatant of combatants) {
      const pos: CombatantPosition = {
        combatantId: combatant.id,
        position: combatant.position,
        reach: combatant.reach ?? 1,
        speed: combatant.speed ?? 30,
        isHostile: combatant.isHostile,
      };
      positions.set(combatant.id, pos);
      occupancy.set(this.posKey(combatant.position), combatant.id);
    }

    this.gridStates.set(combatId, { width, height, positions, occupancy });
    this.logger.debug(`Initialized grid ${width}x${height} for combat ${combatId}`);
  }

  /**
   * Get current position of a combatant
   */
  getPosition(combatId: string, combatantId: string): GridPositionDto | null {
    const state = this.gridStates.get(combatId);
    return state?.positions.get(combatantId)?.position ?? null;
  }

  /**
   * Get all positions in a combat
   */
  getAllPositions(combatId: string): CombatantPosition[] {
    const state = this.gridStates.get(combatId);
    return state ? Array.from(state.positions.values()) : [];
  }

  /**
   * Validate a movement path
   * @param activeEffects - Active turn effects from combat state (e.g., ['dashed', 'disengaged'])
   */
  validatePath(
    combatId: string,
    combatantId: string,
    path: GridPositionDto[],
    activeEffects: string[],
  ): { valid: boolean; error?: string } {
    const state = this.gridStates.get(combatId);
    if (!state) {
      return { valid: false, error: "Combat session not found" };
    }

    const combatant = state.positions.get(combatantId);
    if (!combatant) {
      return { valid: false, error: "Combatant not found" };
    }

    if (path.length === 0) {
      return { valid: false, error: "Empty path" };
    }

    // Check first position matches current position
    const current = combatant.position;
    if (path[0].x !== current.x || path[0].y !== current.y) {
      return { valid: false, error: "Path must start at current position" };
    }

    // Calculate movement cost - check for 'dashed' effect
    const distance = path.length - 1; // number of moves
    const hasDashed = activeEffects.includes("dashed");
    const maxDistance = hasDashed ? combatant.speed * 2 : combatant.speed;

    if (distance > maxDistance) {
      return {
        valid: false,
        error: `Movement exceeds available speed (${distance} > ${maxDistance})`,
      };
    }

    // Validate each step
    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1];
      const to = path[i];

      // Check adjacency (allow diagonal, max 1 tile distance)
      const dx = Math.abs(to.x - from.x);
      const dy = Math.abs(to.y - from.y);
      if (dx > 1 || dy > 1) {
        return { valid: false, error: `Non-adjacent move at step ${i}` };
      }

      // Check bounds
      if (to.x < 0 || to.x >= state.width || to.y < 0 || to.y >= state.height) {
        return { valid: false, error: `Position out of bounds at step ${i}` };
      }

      // Check occupancy (cannot move through occupied tiles except destination)
      if (i < path.length - 1) {
        const occupant = state.occupancy.get(this.posKey(to));
        if (occupant && occupant !== combatantId) {
          return { valid: false, error: `Tile occupied at step ${i}` };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Apply movement (update position in grid state)
   */
  applyMovement(combatId: string, combatantId: string, newPosition: GridPositionDto): void {
    const state = this.gridStates.get(combatId);
    if (!state) {
      throw new Error("Combat session not found");
    }

    const combatant = state.positions.get(combatantId);
    if (!combatant) {
      throw new Error("Combatant not found");
    }

    // Clear old occupancy
    state.occupancy.delete(this.posKey(combatant.position));

    // Update position
    combatant.position = newPosition;

    // Set new occupancy
    state.occupancy.set(this.posKey(newPosition), combatantId);

    this.logger.debug(`Moved ${combatantId} to (${newPosition.x}, ${newPosition.y})`);
  }

  /**
   * Check if two positions are adjacent (including diagonal)
   */
  isAdjacent(pos1: GridPositionDto, pos2: GridPositionDto): boolean {
    const dx = Math.abs(pos1.x - pos2.x);
    const dy = Math.abs(pos1.y - pos2.y);
    return dx <= 1 && dy <= 1 && dx + dy > 0;
  }

  /**
   * Check if a position is within reach of a combatant
   */
  isInReach(combatId: string, combatantId: string, targetPos: GridPositionDto): boolean {
    const state = this.gridStates.get(combatId);
    if (!state) return false;

    const combatant = state.positions.get(combatantId);
    if (!combatant) return false;

    const distance = this.getDistance(combatant.position, targetPos);
    return distance <= combatant.reach;
  }

  /**
   * Get Manhattan distance between two positions
   */
  private getDistance(pos1: GridPositionDto, pos2: GridPositionDto): number {
    return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
  }

  /**
   * Generate position key for occupancy map
   */
  private posKey(pos: GridPositionDto): string {
    return `${pos.x},${pos.y}`;
  }

  /**
   * Clean up grid state for a combat session
   */
  clearGrid(combatId: string): void {
    this.gridStates.delete(combatId);
    this.logger.debug(`Cleared grid for combat ${combatId}`);
  }
}
