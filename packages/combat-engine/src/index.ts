// @rpg-gen/combat-engine - Public API exports

// Main component
export { default as CombatArena } from './CombatArena.vue';

// Composable
export { usePixiCombat } from './composable/usePixiCombat';
export type {
  CombatEngineEventType,
  CombatEngineEventPayload,
  UnitClickedPayload,
  UnitAttackedPayload,
} from './composable/usePixiCombat';

// Types
export type {
  GridPosition,
  UnitConfig,
  UnitStats,
  CombatConfig,
  CombatEvent,
} from './types/combat-types';
