import type { GridPosition, GridPositionDto } from "../types/combat-types.js";

/**
 * Convert backend GridPositionDto (x/y) to engine GridPosition (gridX/gridY).
 */
export function toEnginePosition(dto: GridPositionDto): GridPosition {
  return {
    gridX: dto.x,
    gridY: dto.y,
  };
}

/**
 * Convert engine GridPosition (gridX/gridY) to backend GridPositionDto (x/y).
 */
export function toBackendPosition(pos: GridPosition): GridPositionDto {
  return {
    x: pos.gridX,
    y: pos.gridY,
  };
}

/**
 * Convert array of backend positions to engine positions.
 */
export function toEnginePositions(dtos: GridPositionDto[]): GridPosition[] {
  return dtos.map(toEnginePosition);
}

/**
 * Convert array of engine positions to backend positions.
 */
export function toBackendPositions(positions: GridPosition[]): GridPositionDto[] {
  return positions.map(toBackendPosition);
}
