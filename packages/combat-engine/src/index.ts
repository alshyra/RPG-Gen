// @rpg-gen/combat-engine - Public API exports

// Main component
export { default as CombatArena } from './CombatArena.vue';

// Composable
export { useCombat } from './composable/useCombat';
export type {
  CombatEngineEventType,
  CombatEngineEventPayload,
  UnitClickedPayload,
  UnitAttackedPayload,
} from './types/combat-types';

// Types
export type {
  GridPosition,
  UnitConfig,
  UnitStats,
  CombatConfig,
  CombatEvent,
} from './types/combat-types';
