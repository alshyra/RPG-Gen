// @rpg-gen/combat-engine - Public API exports

// Main component
export { default as CombatArena } from "./CombatArena.vue";

// Composable
export { useCombat } from "./composable/useCombat";
export type {
  CombatEngineEventType,
  CombatEngineEventPayload,
  UnitClickedPayload,
  UnitAttackedPayload,
} from "./types/combat-types";

// Types (engine-specific)
export type {
  GridPosition,
  UnitConfig,
  UnitStats,
  CombatConfig,
  CombatEvent,
} from "./types/combat-types";

// Re-export backend DTOs for convenience
export type {
  CombatantDto,
  GridPositionDto,
  MovementResponseDto,
  MovementEventDto,
} from "./types/combat-types";

// Adapters (for converting backend ↔ engine formats)
export {
  toEnginePosition,
  toBackendPosition,
  toEnginePositions,
  toBackendPositions,
} from "./adapters/position-adapter";
