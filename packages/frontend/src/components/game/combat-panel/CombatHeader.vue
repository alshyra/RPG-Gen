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
  </div>
</template>

<script setup lang="ts">
import { combatService } from '@/apis/combatApi';
import UiButton from '@/components/ui/UiButton.vue';
import { useCombatEngine } from '@/composables/useCombatEngine';
import { useCharacterStore } from '@/stores/characterStore';
import { useCombatStore } from '@/stores/combatStore';
import { useGameStore } from '@/stores/gameStore';
import { Activity, Flag, Star } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

const combatStore = useCombatStore();
const characterStore = useCharacterStore();
const { currentCharacter } = storeToRefs(characterStore);
const { replayEnemyAttacks } = useCombatEngine();
const { roundNumber, actionRemaining, bonusActionRemaining, phase } = storeToRefs(combatStore);

const phaseLabel = computed(() => {
  switch (phase.value) {
    case 'PLAYER_TURN':
      return 'Your Turn';
    case 'AWAITING_DAMAGE_ROLL':
      return 'Roll Damage';
    case 'ENEMY_TURN':
      return 'Enemy Turn';
    case 'COMBAT_ENDED':
      return 'Combat Over';
    default:
      return 'Your Turn';
  }
});

const phaseClass = computed(() => {
  switch (phase.value) {
    case 'PLAYER_TURN':
      return 'bg-green-600 text-white';
    case 'AWAITING_DAMAGE_ROLL':
      return 'bg-amber-600 text-white';
    case 'ENEMY_TURN':
      return 'bg-red-600 text-white';
    case 'COMBAT_ENDED':
      return 'bg-slate-600 text-white';
    default:
      return 'bg-green-600 text-white';
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

    // Call the API directly to get the response with attackLogs
    const response = await combatService.endActivation(currentCharacter.value.characterId);

    // Replay enemy attacks on visual engine (if arena is registered)
    if (response.attackLogs?.length) {
      await replayEnemyAttacks(response.attackLogs);
    }

    // Update combat store with the result
    combatStore.updateFromTurnResult(response);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (
      message.includes('Combat session not found') ||
      message.includes('No active combat found')
    ) {
      combatStore.clearCombat();
      gameStore.appendMessage(
        'system',
        "⚠️ Combat terminé (session introuvable) — l'état a été réinitialisé.",
      );
    } else {
      console.error('Failed to end turn', e);
    }
  } finally {
    isEndingTurn.value = false;
  }
};
</script>

<style scoped></style>
