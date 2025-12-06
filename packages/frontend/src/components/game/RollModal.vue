<template>
  <UiModal
    :is-open="gameStore.showRollModal"
    @close="closeModal"
  >
    <template #header>
      <h3 class="text-lg font-semibold mb-2">
        Roll result
      </h3>
    </template>

    <div data-cy="roll-modal">
      <div class="mb-4 text-sm text-slate-300 flex flex-col gap-4 items-center">
        <!-- D20 component on the left -->
        <DieD20
          :value="rollData.total"
          :size="88"
          data-cy="d20"
        />

        <div class="flex-1 min-w-0">
          <div v-if="rollData.skillName">
            Skill: <strong>{{ rollData.skillName }}</strong>
          </div>
          <div v-if="typeof rollData.bonus === 'number'">
            Bonus: <strong>{{ rollData.bonus }}</strong>
          </div>
          <div v-if="rollData.action">
            Action: <strong>{{ rollData.action }}</strong>
          </div>
          <div v-if="rollData.target">
            Target: <strong>{{ rollData.target }}</strong>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end items-center">
        <UiButton
          data-cy="roll-reroll"
          variant="secondary"
          :disabled="gameStore.sending"
          @click="rerollDice"
        >
          Re-roll
        </UiButton>

        <UiButton
          data-cy="roll-send"
          variant="primary"
          :is-loading="gameStore.sending"
          @click="confirmRoll"
        >
          Send Result
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import UiModal from '@/components/ui/UiModal.vue';
import UiButton from '@/components/ui/UiButton.vue';
import DieD20 from './DieD20.vue';
import { useGameStore } from '@/stores/gameStore';
import { storeToRefs } from 'pinia';
import { useGameRolls } from '@/composables/useGameRolls';

const gameStore = useGameStore();
const { rollData } = storeToRefs(gameStore);

// instantiate composable to get handlers (confirmRoll, rerollDice)
const {
  confirmRoll, rerollDice,
} = useGameRolls();

const closeModal = () => {
  confirmRoll();
  gameStore.showRollModal = false;
};
</script>

<style scoped>
.text-slate-300 strong { color: var(--tw-color-slate-200); }

.die-wrapper { width: 88px; height: 88px; display: flex; align-items: center; justify-content: center; }
.d20-svg { width: 88px; height: 88px; filter: drop-shadow(0 6px 16px rgba(0,0,0,0.6)); border-radius: 12px; }
.d20-svg polygon { transition: transform .18s ease; transform-origin: center; }
.d20-svg:hover polygon { transform: scale(1.02) translateY(-2px); }

</style>
