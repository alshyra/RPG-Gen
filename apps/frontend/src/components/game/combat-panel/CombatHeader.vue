<template>
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2 text-slate-200 font-semibold">
      <Flag class="w-4 h-4 text-amber-300" />
      <span>Combat</span>
    </div>
    <div
      class="ml-2 text-sm text-slate-400"
      data-cy="combat-round"
    >
      Round {{ roundNumber }}
    </div>

    <div class="ml-auto flex items-center gap-3 text-sm">
      <div
        class="flex items-center gap-1"
        data-cy="action-counter"
        :class="actionRemaining > 0 ? 'text-green-400' : 'text-slate-500'"
      >
        <Activity class="w-4 h-4" />
        <span>{{ actionRemaining }}</span>
      </div>

      <div
        class="flex items-center gap-1"
        data-cy="bonus-action-counter"
        :class="bonusActionRemaining > 0 ? 'text-amber-400' : 'text-slate-500'"
      >
        <Star class="w-4 h-4" />
        <span>{{ bonusActionRemaining }}</span>
      </div>
    </div>
    <UiButton
      data-cy="end-turn-button"
      :class="endTurnButtonClass"
      :disabled="!canEndTurn || combatApi.endTurn.isPending.value"
      @click="endTurn"
    >
      <span v-if="combatApi.endTurn.isPending.value">En cours...</span>
      <span v-else>Fin de tour</span>
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import { UiButton } from '@rpg-gen/ui';
import { useCombatEngine } from '@/composables/useCombatEngine';
import { useCombat } from '@rpg-gen/api-client';
import { useCharacterId } from '@/composables/useCharacterId';
import { Activity, Flag, Star } from 'lucide-vue-next';
import { computed } from 'vue';

const { endTurn } = useCombatEngine();
const characterId = useCharacterId();
const combatApi = useCombat(characterId);

const roundNumber = computed(() => combatApi.status.data.value?.roundNumber ?? 1);
const actionRemaining = computed(() => combatApi.status.data.value?.actionRemaining ?? 1);
const bonusActionRemaining = computed(() => combatApi.status.data.value?.bonusActionRemaining ?? 1);

// Can end turn if there are no pending mutations
const canEndTurn = computed(() => !combatApi.endTurn.isPending.value);

const endTurnButtonClass = computed(() => {
  if (!canEndTurn.value) {
    return 'bg-slate-600 text-slate-400 cursor-not-allowed';
  }
  return 'bg-purple-600 hover:bg-purple-700 text-white';
});
</script>
