/**
 * Combat Actions Module - Action economy and turn resources
 * Manages: action points, bonus actions, targeting
 */

import type { CombatantDto } from "@rpg-gen/shared";
import { computed, ref } from "vue";

export function createCombatActions() {
  // Action economy
  const actionRemaining = ref(1);
  const actionMax = ref(1);
  const bonusActionRemaining = ref(1);
  const bonusActionMax = ref(1);
  
  // Target selection
  const currentTarget = ref<CombatantDto | null>(null);
  
  // Computed availability
  const canAct = computed(() => (actionRemaining.value ?? 0) > 0);
  const canBonusAct = computed(() => (bonusActionRemaining.value ?? 0) > 0);
  
  return {
    actionRemaining,
    actionMax,
    bonusActionRemaining,
    bonusActionMax,
    currentTarget,
    canAct,
    canBonusAct,
  };
}
