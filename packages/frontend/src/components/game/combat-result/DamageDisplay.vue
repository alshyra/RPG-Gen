<template>
  <div
    v-if="(currentAttack?.hit ?? false)"
    class="bg-slate-700/50 rounded-lg p-4 mb-4"
  >
    <div class="text-center">
      <div class="text-sm text-slate-400 mb-2">
        Dégâts infligés
      </div>

      <div class="flex justify-center items-center gap-2 mb-2">
        <div
          v-for="(roll, idx) in (currentAttack?.damageRoll ?? [])"
          :key="idx"
          class="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold bg-red-600/50 text-red-200 border border-red-500"
        >
          {{ roll }}
        </div>

        <span
          v-if="(currentAttack?.damageBonus ?? 0) !== 0"
          class="text-slate-400"
        >+</span>
        <div
          v-if="(currentAttack?.damageBonus ?? 0) !== 0"
          class="text-lg text-slate-300"
        >
          {{ currentAttack?.damageBonus ?? 0 }}
        </div>
        <span class="text-slate-400">=</span>
        <div class="text-2xl font-bold text-red-400">
          {{ currentAttack?.totalDamage ?? 0 }}
        </div>
      </div>

      <div
        v-if="currentAttack?.critical ?? false"
        class="text-xs text-green-400"
      >
        (Dégâts doublés par le critique!)
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCombatStore } from '@/stores/combatStore';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const combatStore = useCombatStore();
const { currentAttackResult } = storeToRefs(combatStore);

const currentAttack = computed(() => {
  const r = currentAttackResult?.value as any;
  if (!r) return undefined;
  return r.state?.playerAttacks?.[0] ?? r.playerAttacks?.[0] ?? r;
});
</script>
