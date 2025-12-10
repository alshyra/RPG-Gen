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

    <!-- Action Menu Overlay (au clic ennemi) -->
    <ActionMenuOverlay
      :is-open="isActionMenuOpen"
      :unit-id="actionMenuUnitId"
      :x="actionMenuX"
      :y="actionMenuY"
      :selected-target="selectedTarget"
      @close="closeActionMenu"
      @attack="handleAttackFromMenu"
      @spell="handleSpellFromMenu"
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
import { ref, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { CombatArena } from '@rpg-gen/combat-engine';
import CombatHeader from './CombatHeader.vue';
import ActionMenuOverlay from '../ActionMenuOverlay.vue';
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
  isActionMenuOpen,
  actionMenuUnitId,
  actionMenuX,
  actionMenuY,
  executeAttack,
  closeActionModal,
  closeActionMenu,
  handleAttackFromMenu,
  handleSpellFromMenu,
  initializeVisual,
} = useCombatEngine();

// Reference to arena component
const arenaRef = ref<InstanceType<typeof CombatArena> | null>(null);

// Handle attack from SpellSelector modal
const handleAttack = async (target: CombatantDto, spellName?: string) => {
  await executeAttack(target, spellName);
};

// Register arena API when mounted
onMounted(async () => {
  const arena = arenaRef.value;
  if (arena && 'getContainer' in arena && 'init' in arena) {
    // Type guard ensures arena has the required API methods
    registerArena(arena as CombatArenaApi);

    // Get container and initialize PIXI
    const container = arena.getContainer();
    if (container) {
      await arena.init(container);
      await initializeVisual();
    }
  }
});

onUnmounted(() => {
  unregisterArena();
});
</script>
