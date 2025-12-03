<template>
  <UiModal
    :is-open="showAttackResultModal"
    @close="close"
  >
    <CombatResultHeader />
    <AttackRollDisplay />
    <DamageDisplay />
    <HpChanges />

    <UiButton
      v-if="hasDamageRollInstructions"
      @click="combat.throwDamageDice()"
    >
      Lancer les dégats
    </UiButton>
    <UiButton
      v-else
      @click="close"
    >
      Continuer
    </UiButton>
  </UiModal>
</template>

<script setup lang="ts">
import UiModal from '../ui/UiModal.vue';
import CombatResultHeader from './combat-result/CombatResultHeader.vue';
import AttackRollDisplay from './combat-result/AttackRollDisplay.vue';
import DamageDisplay from './combat-result/DamageDisplay.vue';
import HpChanges from './combat-result/HpChanges.vue';
import { useCombatStore } from '../../stores/combatStore';
import { storeToRefs } from 'pinia';
import UiButton from '../ui/UiButton.vue';
import { useCombat } from '@/composables/useCombat';
import { computed } from 'vue';

const combatStore = useCombatStore();

const combat = useCombat();

const { showAttackResultModal } = storeToRefs(combatStore);
const { currentAttackResult } = storeToRefs(combatStore);

const hasDamageRollInstructions = computed(() => {
  const rollInstr = currentAttackResult?.value?.rollInstruction ?? (currentAttackResult?.value as any)?.instructions?.[0];
  return !!(rollInstr && rollInstr.type === 'roll');
});

const close = () => showAttackResultModal.value = false;
</script>
