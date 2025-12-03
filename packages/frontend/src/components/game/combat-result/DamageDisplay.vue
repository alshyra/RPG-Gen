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

      <!-- Button to initiate damage roll when dice are present and not already rolled -->
      <div class="mt-4">
        <UiButton
          @click="launchDamageRoll"
        >
          Lancer le jet de dégâts
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useCombatStore } from '@/stores/combatStore';
import { useGameStore } from '@/stores/gameStore';
import UiButton from '@/components/ui/UiButton.vue';

const combatStore = useCombatStore();
const gameStore = useGameStore();
const { currentAttackResult } = storeToRefs(combatStore);

const currentAttack = computed(() => {
  const r = currentAttackResult?.value as any;
  if (!r) return undefined;
  return r.state?.playerAttacks?.[0] ?? r.playerAttacks?.[0] ?? r;
});
// no local computed helpers used anymore; we rely directly on currentAttack in template

const launchDamageRoll = async () => {
  if (!currentAttackResult.value) return;

  // Build a pending roll instruction for damage and set it on the game store
  const diceExpr = currentAttack.value.damageDice ?? '';
  const target = currentAttack.value.target ?? undefined;

  const rollInstr = {
    type: 'roll',
    dices: diceExpr,
    advantage: 'none',
    description: `Damage vs ${target ?? 'target'}`,
    meta: {
      action: 'damage',
      target,
      damageBonus: currentAttack.value.damageBonus,
    },
  } as any;

  // mark combat store expected dto / phase
  combatStore.setActionToken(combatStore.actionToken, 'AWAITING_DAMAGE_ROLL', 'DiceThrowDto');

  gameStore.pendingInstruction = rollInstr;

  try {
    // Trigger an immediate roll using the dice expression — this will set latestRoll
    // and the roll-handling composable will pick it up and show the roll modal
    await gameStore.doRoll(diceExpr, 'none');
  } catch (e) {
    console.error('Failed to perform damage roll', e);
  }
};
</script>

<style scoped></style>
