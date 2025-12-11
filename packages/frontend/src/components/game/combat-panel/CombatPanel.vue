<!-- packages/frontend/src/components/game/combat-panel/CombatPanel.vue -->
<template>
  <div
    class="combat-wrapper"
    data-cy="combat-panel"
  >
    <!-- Header avec infos turn/actions (seulement si en combat) -->
    <CombatHeader v-if="inCombat" />

    <!-- NOUVEAU : Arène visuelle PixiJS (toujours affiché) -->
    <!-- key="combat-canvas" prevents re-renders from parent state changes -->
    <CombatArena
      key="combat-canvas"
      ref="arenaRef"
      data-cy="combat-arena"
    />

    <!-- Message si pas en combat -->
    <div
      v-if="!inCombat"
      class="demo-message"
    >
      <p>Pas de combat actif. Démarrez un combat depuis le jeu pour voir l'arène en action !</p>
    </div>

    <!-- Modal de sélection d'action (attaque arme / sort) -->
    <SpellSelector
      v-if="inCombat"
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

      // Si en combat, initialiser avec les vraies données
      if (inCombat.value) {
        await initializeVisual();
      } else {
        // Sinon, créer une démo simple
        await arena.createUnit('demo-player', 2, 4, 3, 'Archer-Green', 100, 100, true);
        await arena.createUnit('demo-enemy', 8, 4, 2, 'Soldier-Red', 50, 50, false);
        arena.setupDragEvents();
      }
    }
  }
});

// Re-initialize visual when combat state changes significantly
watch(
  () => [combatStore.inCombat, combatStore.enemies.length, combatStore.player?.hp],
  async ([inCombatNow]) => {
    if (inCombatNow && arenaRef.value) {
      // Small delay to ensure store updates propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      await initializeVisual();
    }
  },
  { deep: false },
);

onUnmounted(() => {
  unregisterArena();
});
</script>

<style scoped>
.combat-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.demo-message {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  color: #e0e0e0;
  margin-top: 20px;
}

.demo-message p {
  margin: 0;
  font-size: 16px;
}
</style>
