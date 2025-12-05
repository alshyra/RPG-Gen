<template>
  <!-- Combat wrapper manages its own fixed positioning, header, bump and collapsed state -->
  <transition
    name="combat-panel"
    appear
  >
    <div
      v-if="inCombat && ui.isCombatOpen"
      class="inset-x-4 max-w-5xl mx-auto z-60 pointer-events-auto"
    >
      <div
        data-cy="combat-panel"
        class="bg-slate-900/95 border border-slate-700 shadow-lg relative w-full rounded-t-lg rounded-b-none p-4"
      >
        <CombatHeader />

        <div
          class="card p-1 mb-2 max-h-44 mt-3"
          data-cy="combat-panel"
        >
          <ParticipantsGrid />
        </div>
      </div>
    </div>
  </transition>

  <!-- Collapsed handle (still visible when combat present) -->
  <transition name="combat-handle">
    <div
      v-if="inCombat && !ui.isCombatOpen"
      class="transition-all duration-700 inset-x-4 max-w-5xl mx-auto z-60 pointer-events-auto"
    >
      <div class="bg-slate-900/95 border border-slate-700 shadow-lg relative w-full rounded-t-lg h-10 flex items-center px-4">
        <div class="flex items-center gap-3 w-full">
          <div class="flex items-center gap-2 text-slate-200 font-semibold">
            <span>Combat</span>
          </div>
          <div class="ml-auto text-sm text-slate-400">
            Round {{ roundNumber }}
          </div>
        </div>

        <button
          class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 border border-slate-700 shadow-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
          :aria-expanded="ui.isCombatOpen"
          aria-label="Afficher le panneau de combat"
          @click="ui.toggleCombat()"
        >
          <ChevronUp
            :class="['w-4 h-4 text-slate-200 transform-gpu transition-transform duration-250', ui.isCombatOpen ? 'rotate-180' : 'rotate-0']"
          />
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ChevronUp } from 'lucide-vue-next';
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import CombatHeader from './CombatHeader.vue';
import ParticipantsGrid from './ParticipantsGrid.vue';

import { useCombatStore } from '@/stores/combatStore';
import { useUiStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';

const combatStore = useCombatStore();
const ui = useUiStore();
const { isCombatOpen } = storeToRefs(ui);
const {
  inCombat, roundNumber,
} = storeToRefs(combatStore);

const containerEl = ref<HTMLElement | null>(null);
const height = ref<number>(0);

const updateHeight = () => {
  if (containerEl.value) height.value = containerEl.value.scrollHeight;
};

onMounted(() => {
  nextTick()
    .then(updateHeight);
  window.addEventListener('resize', updateHeight);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateHeight);
});

// Recompute height when open state changes
watch(
  () => isCombatOpen,
  async () => {
    await nextTick();
    updateHeight();
  },
);

</script>

<style scoped>
.combat-panel-enter-from,
.combat-panel-leave-to {
  max-height: 0;
  opacity: 0;
}
.combat-panel-enter-from {
  max-height: 0;
  opacity: 0;
}
.combat-panel-enter-to,
.combat-panel-leave-from {
  opacity: 1;
}
.combat-panel-enter-active,
.combat-panel-leave-active {
  transition: max-height 320ms cubic-bezier(.16,.84,.24,1), opacity 220ms ease;
  will-change: max-height, opacity;
}

/* Collapsed handle: shrink/grow opposite to the main panel */
.combat-handle-enter-from,
.combat-handle-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
.combat-handle-enter-to,
.combat-handle-leave-from {
  max-height: 64px; /* enough to show the 40px handle comfortably */
  opacity: 1;
}
.combat-handle-enter-active,
.combat-handle-leave-active {
  transition: max-height 280ms cubic-bezier(.16,.84,.24,1), opacity 160ms ease;
  will-change: max-height, opacity;
}
</style>
