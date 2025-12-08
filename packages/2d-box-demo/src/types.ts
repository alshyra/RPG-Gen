/**
 * Represents a unit token on the combat grid.
 */
export interface UnitToken {
  /** Unique identifier for the unit */
  id: string;
  /** X coordinate on the grid (0-6) */
  x: number;
  /** Y coordinate on the grid (0-6) */
  y: number;
  /** Whether this unit is controlled by the player */
  isPlayer: boolean;
  /** Color of the token (CSS color string) */
  color: string;
  /** Per-unit movement range (optional, falls back to grid's maxMoves) */
  moves?: number;
}
