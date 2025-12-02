<template>
  <div class="mb-2">
    <div
      data-cy="turn-order"
      class="flex gap-2 items-center text-xs overflow-auto"
    >
      <template
        v-for="(t, i) in turnOrder"
        :key="t.id"
      >
        <div
          :data-cy="t.isPlayer ? 'turn-order-player' : ('turn-order-' + i)"
          :class="['px-2 py-1 rounded', currentTurnIndex === i ? 'ring-2 ring-amber-400' : 'bg-slate-800']"
        >
          <span v-text="t.name" />
          <div
            v-if="currentTurnIndex === i"
            data-cy="current-activation"
            class="sr-only"
          >
            current
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCombatStore } from '@/stores/combatStore';

const combatStore = useCombatStore();
const {
  turnOrder,
  currentTurnIndex,
} = storeToRefs(combatStore);
</script>

<style scoped></style>
