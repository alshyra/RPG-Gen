<template>
  <div
    class="bg-slate-700/50 rounded-lg p-4 mb-4"
  >
    <div class="flex justify-between items-center">
      <div class="text-sm text-slate-400">PV de {{ currentAttack?.target ?? '' }}</div>
      <div class="flex items-center gap-2">
        <span class="text-slate-300">{{ currentAttack?.targetHpBefore ?? 0 }}</span>
        <span class="text-red-400">→</span>
        <span
          :class="
            (currentAttack?.targetHpAfter ?? 0) <= 0 ? 'text-red-500 font-bold' : 'text-slate-300'
          "
          >{{ currentAttack?.targetHpAfter ?? 0 }}</span
        >
      </div>
    </div>
    <div
      v-if="currentAttack?.targetDefeated ?? false"
      class="text-center mt-3 text-amber-400 font-bold"
    >
      🏆 {{ currentAttack?.target ?? '' }} est vaincu!
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useCombatStore } from '@/stores/combatStore';

const combatStore = useCombatStore();
const { currentAttackView } = storeToRefs(combatStore);

const currentAttack = computed(() => currentAttackView?.value ?? undefined);
</script>

<style scoped></style>
