// @rpg-gen/combat-engine - Public API exports

// Main component
export { default as CombatArena } from './CombatArena.vue';

// Composable
export { usePixiCombat } from './composable/useCombat';
export type {
  CombatEngineEventType,
  CombatEngineEventPayload,
  UnitClickedPayload,
  UnitAttackedPayload,
} from './composable/useCombat';

// Types
export type {
  GridPosition,
  UnitConfig,
  UnitStats,
  CombatConfig,
  CombatEvent,
} from './types/combat-types';
