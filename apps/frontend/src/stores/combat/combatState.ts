/**
 * Combat State Module - Core combat lifecycle state
 * Manages: combat status, phases, rounds, turn order
 */

import type { CombatantDto, CombatPhase } from "@rpg-gen/shared";
import { computed, ref } from "vue";

export function createCombatState() {
  // Core combat status
  const inCombat = ref(false);
  const roundNumber = ref(1);
  const phase = ref<CombatPhase>("PLAYER_TURN");
  
  // Combatants and turn management
  const enemies = ref<CombatantDto[]>([]);
  const player = ref<CombatantDto | null>(null);
  const turnOrder = ref<CombatantDto[]>([]);
  const currentTurnIndex = ref(0);
  const playerInitiative = ref(0);
  
  // Computed state
  const aliveEnemies = computed(() => enemies.value.filter(e => (e.hp ?? 0) > 0));
  const validTargets = computed(() => aliveEnemies.value.map(e => e.name));
  const hasValidTarget = computed(() => validTargets.value.length > 0);
  
  const currentCombatant = computed(() => {
    if (turnOrder.value.length === 0) return null;
    return turnOrder.value[currentTurnIndex.value] ?? null;
  });
  
  const isPlayerTurn = computed(() => {
    const cc = currentCombatant.value;
    if (!cc) return false;
    return cc.id === player.value?.id;
  });
  
  return {
    // Refs
    inCombat,
    roundNumber,
    phase,
    enemies,
    player,
    turnOrder,
    currentTurnIndex,
    playerInitiative,
    
    // Computed
    aliveEnemies,
    validTargets,
    hasValidTarget,
    currentCombatant,
    isPlayerTurn,
  };
}
