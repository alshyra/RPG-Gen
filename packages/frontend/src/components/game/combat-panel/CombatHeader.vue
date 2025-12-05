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

      <div
        class="px-2 py-0.5 rounded text-xs font-medium"
        data-cy="combat-phase"
        :class="phaseClass"
      >
        {{ phaseLabel }}
      </div>
    </div>
    <UiButton
      data-cy="end-turn-button"
      :class="endTurnButtonClass"
      :disabled="!canEndTurn || isEndingTurn"
      @click="onEndTurn"
    >
      <span v-if="isEndingTurn">En cours...</span>
      <span v-else>Fin de tour</span>
    </UiButton>
    <button
      class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 border border-slate-700 shadow-md border-b-0 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
      :aria-expanded="isCombatOpen"
      :aria-label="isCombatOpen ? 'Masquer le panneau de combat' : 'Afficher le panneau de combat'"
      @click="ui.toggleCombat()"
    >
      <ChevronUp :class="['w-4 h-4 text-slate-200 transform-gpu transition-transform duration-250', isCombatOpen ? 'rotate-180' : 'rotate-0']" />
    </button>
  </div>
</template>

<script setup lang="ts">
import UiButton from '@/components/ui/UiButton.vue';
import { useCharacterStore } from '@/stores/characterStore';
import { useCombatStore } from '@/stores/combatStore';
import { useUiStore } from '@/stores/uiStore';
import {
  Activity,
  ChevronUp,
  Flag,
  Star,
} from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useGameStore } from '@/stores/gameStore';
import { computed, ref } from 'vue';

const combatStore = useCombatStore();
const ui = useUiStore();
const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);
const {
  roundNumber,
  actionRemaining,
  bonusActionRemaining,
  phase,
} = storeToRefs(combatStore);
const {
  isCombatOpen,
} = storeToRefs(ui);

const phaseLabel = computed(() => {
  switch (phase.value) {
    case 'PLAYER_TURN': return 'Your Turn';
    case 'AWAITING_DAMAGE_ROLL': return 'Roll Damage';
    case 'ENEMY_TURN': return 'Enemy Turn';
    case 'COMBAT_ENDED': return 'Combat Over';
    default: return 'Your Turn';
  }
});

const phaseClass = computed(() => {
  switch (phase.value) {
    case 'PLAYER_TURN': return 'bg-green-600 text-white';
    case 'AWAITING_DAMAGE_ROLL': return 'bg-amber-600 text-white';
    case 'ENEMY_TURN': return 'bg-red-600 text-white';
    case 'COMBAT_ENDED': return 'bg-slate-600 text-white';
    default: return 'bg-green-600 text-white';
  }
});

const isEndingTurn = ref(false);
const gameStore = useGameStore();

// Can end turn only during player turn
const canEndTurn = computed(() => phase.value === 'PLAYER_TURN' && !isEndingTurn.value);

const endTurnButtonClass = computed(() => {
  if (!canEndTurn.value) {
    return 'bg-slate-600 text-slate-400 cursor-not-allowed';
  }
  return 'bg-purple-600 hover:bg-purple-700 text-white';
});

const onEndTurn = async () => {
  if (!currentCharacter.value || isEndingTurn.value) return;

  try {
    isEndingTurn.value = true;
    await combatStore.endActivation(currentCharacter.value.characterId);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('Combat session not found') || message.includes('No active combat found')) {
      combatStore.clearCombat();
      gameStore.appendMessage('system', '⚠️ Combat terminé (session introuvable) — l\'état a été réinitialisé.');
    } else {
      console.error('Failed to end turn', e);
    }
  } finally {
    isEndingTurn.value = false;
  }
};

</script>

<style scoped></style>
