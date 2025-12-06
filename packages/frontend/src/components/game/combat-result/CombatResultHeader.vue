<template>
  <div class="text-center mb-6">
    <h2 class="text-2xl font-bold text-amber-400 mb-2">
      ⚔️ {{ isCurrentAttackPlayerAttack ? 'Votre Attaque' : 'Attaque Ennemie' }}
    </h2>
    <div class="text-sm text-slate-400">
      {{ currentAttack?.attacker ?? '' }} → {{ currentAttack?.target ?? '' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useCombatStore } from '@/stores/combatStore';

const combatStore = useCombatStore();
const {
  currentAttackResult, isCurrentAttackPlayerAttack,
} = storeToRefs(combatStore);

const currentAttack = computed(() => {
  const r = currentAttackResult?.value as any;
  console.warn('FIXTYPE: currentAttackResult', r);
  if (!r) return undefined;
  return r.state?.playerAttacks?.[0] ?? r.playerAttacks?.[0] ?? r;
});
</script>
