<template>
  <div class="bg-slate-700/50 rounded-lg p-4 mb-4">
    {{ currentAttackResult?.narrative }}

    <div>
      {{ rollInstructions?.description }}
    </div>

    {{ rollInstructions?.dices }} + {{ rollInstructions?.modifierValue }}
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCombatStore } from '@/stores/combatStore';
import { computed } from 'vue';
// note: no local UI button or combat composable used here — template only reads current attack

const combatStore = useCombatStore();
const { currentAttackResult } = storeToRefs(combatStore);
const rollInstructions = computed(() => {
  const rollInstr = currentAttackResult?.value?.rollInstruction ?? (currentAttackResult?.value as any)?.instructions?.[0];
  if (!rollInstr || rollInstr.type !== 'roll') return undefined;
  return rollInstr;
});

// no need for currentAttack inside this component right now

</script>

<style scoped></style>
