<!-- packages/frontend/src/components/game/combat-panel/CombatPanel.vue -->
<template>
  <div
    v-if="inCombat"
    class="combat-wrapper"
    data-cy="combat-panel"
  >
    <!-- Header avec infos turn/actions (gardé tel quel) -->
    <CombatHeader />

    <!-- NOUVEAU : Arène visuelle PixiJS -->
    <CombatArena
      ref="arenaRef"
      data-cy="combat-arena"
    />

    <!-- Modal de sélection d'action (attaque arme / sort) -->
    <SpellSelector
      :is-open="isActionModalOpen"
      :target="selectedTarget"
      @close="closeActionModal"
      @attack="handleAttack"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { CombatArena } from '@rpg-gen/combat-engine';
import CombatHeader from './CombatHeader.vue';
import SpellSelector from './SpellSelector.vue';
import { useCombatEngine } from '@/composables/useCombatEngine';
import { useCombatStore } from '@/stores/combatStore';
import type { CombatantDto } from '@rpg-gen/shared';
import type { CombatArenaApi } from '@/composables/useCombatEngine';

const combatStore = useCombatStore();
const { inCombat } = storeToRefs(combatStore);

const {
  registerArena,
  unregisterArena,
  isActionModalOpen,
  selectedTarget,
  executeAttack,
  closeActionModal,
} = useCombatEngine();

// Reference to arena component
const arenaRef = ref<InstanceType<typeof CombatArena> | null>(null);

// Handle attack from SpellSelector modal
const handleAttack = async (target: CombatantDto, spellName?: string) => {
  await executeAttack(target, spellName);
};

// Register arena API when mounted
onMounted(() => {
  if (arenaRef.value) {
    // The arena exposes its API via defineExpose
    registerArena(arenaRef.value as unknown as CombatArenaApi);
  }
});

// Also watch for arena ref changes (in case of dynamic mounting)
watch(arenaRef, newRef => {
  if (newRef) {
    registerArena(newRef as unknown as CombatArenaApi);
  }
});

onUnmounted(() => {
  unregisterArena();
});
</script>
