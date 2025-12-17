import { useCombat } from "@rpg-gen/api-client";
import { computed } from "vue";
import { useCharacterId } from "./useCharacterId";

/**
 * Get current combat status
 * Replaces useCombatStore().combatStatus
 */
export function useCombatStatus() {
  const characterId = useCharacterId();
  const combat = useCombat(characterId);

  return computed(() => combat.status.data.value);
}

/**
 * Get derived combat properties
 * Replaces useCombatStore().inCombat, .enemies, .player, etc
 */
export function useCombatInfo() {
  const combatStatus = useCombatStatus();

  return {
    inCombat: computed(() => combatStatus.value?.inCombat ?? false),
    roundNumber: computed(() => combatStatus.value?.roundNumber ?? 1),
    enemies: computed(() => combatStatus.value?.enemies ?? []),
    player: computed(() => combatStatus.value?.player ?? null),
    turnOrder: computed(() => combatStatus.value?.turnOrder ?? []),
    playerInitiative: computed(() => combatStatus.value?.player?.initiative ?? 0),
    currentTurnIndex: computed(() => combatStatus.value?.currentTurnIndex ?? 0),
    phase: computed<any>(() => combatStatus.value?.phase ?? "PLAYER_TURN"),
    actionRemaining: computed(() => combatStatus.value?.actionRemaining ?? 1),
    actionMax: computed(() => combatStatus.value?.actionMax ?? 1),
    bonusActionRemaining: computed(() => combatStatus.value?.bonusActionRemaining ?? 1),
    bonusActionMax: computed(() => combatStatus.value?.bonusActionMax ?? 1),
    narrative: computed(() => combatStatus.value?.narrative ?? null),
    aliveEnemies: computed(() => (combatStatus.value?.enemies ?? []).filter(e => (e.hp ?? 0) > 0)),
    validTargets: computed(() =>
      (combatStatus.value?.enemies ?? []).filter(e => (e.hp ?? 0) > 0).map(e => e.name),
    ),
    hasValidTarget: computed(() => (combatStatus.value?.enemies ?? []).some(e => (e.hp ?? 0) > 0)),
    canAct: computed(() => (combatStatus.value?.actionRemaining ?? 0) > 0),
    canBonusAct: computed(() => (combatStatus.value?.bonusActionRemaining ?? 0) > 0),
    combatEnd: computed(() => combatStatus.value?.combatEnd),
  };
}
