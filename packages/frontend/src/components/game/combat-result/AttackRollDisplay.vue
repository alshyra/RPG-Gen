<template>
  <div class="bg-slate-700/50 rounded-lg p-4 mb-4">
    <div
      v-if="currentAttackResult?.diceResult"
      class="text-white"
    >
      <div class="text-lg font-semibold mb-2">
        Jet d'attaque
      </div>
      <div class="flex items-center gap-2">
        <span class="text-2xl font-bold">{{ currentAttackResult.diceResult.total }}</span>
        <span class="text-slate-400">
          ({{ currentAttackResult.diceResult.rolls.join(' + ') }} + {{ currentAttackResult.diceResult.modifierValue }})
        </span>
      </div>
      <div
        v-if="currentAttackResult.isCrit"
        class="text-yellow-400 font-bold mt-1"
      >
        ⚔️ CRITIQUE!
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCombatStore } from '@/stores/combatStore';

const combatStore = useCombatStore();
const { currentAttackResult } = storeToRefs(combatStore);
</script>

<style scoped></style>
