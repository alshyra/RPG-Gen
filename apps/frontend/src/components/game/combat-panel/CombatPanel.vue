<!-- packages/frontend/src/components/game/combat-panel/CombatPanel.vue -->
<template>
  <div
    class="combat-wrapper"
    data-cy="combat-panel"
  >
    <CombatHeader v-if="inCombat" />
    <CombatArena
      key="combat-canvas"
      ref="arenaRef"
      data-cy="combat-arena"
    />
    <div
      v-if="!inCombat"
      class="demo-message"
    >
      <p>Pas de combat actif. Démarrez un combat depuis le jeu pour voir l'arène en action !</p>
    </div>
    <SpellSelector
      v-if="inCombat"
      :is-open="isActionModalOpen"
      :target="selectedTarget"
      @close="closeActionModal"
      @attack="handleAttack"
    />
    <CombatEndModal
      :is-open="isCombatEndModalOpen"
      @close="closeCombatEndModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { CombatArena } from '@rpg-gen/combat-engine';
import { storeToRefs } from 'pinia';
import CombatHeader from './CombatHeader.vue';
import SpellSelector from './SpellSelector.vue';
import CombatEndModal from './CombatEndModal.vue';
import { useCombatEngine } from '@/composables/useCombatEngine';
import { useCombat } from '@/composables/useCombat';
import { useCombatApi } from '@rpg-gen/api-client';
import { useCharacterId } from '@/composables/useCharacterId';
import { useCombatStore } from '@/stores/combatStore';
import type { CombatantDto } from '@rpg-gen/shared';
import type { CombatArenaApi } from '@/composables/useCombatEngine';

const {
  registerArena,
  unregisterArena,
  isActionModalOpen,
  selectedTarget,
  executeAttack,
  closeActionModal,
  initializeVisual,
} = useCombatEngine();

const { closeCombatEndModal } = useCombat();
const combatStore = useCombatStore();
const { isCombatEndModalOpen } = storeToRefs(combatStore);
const characterId = useCharacterId();
const combatApi = useCombatApi(characterId);

// Reference to arena component
const arenaRef = ref<InstanceType<typeof CombatArena> | null>(null);
const handleAttack = async (target: CombatantDto, spellName?: string) => {
  await executeAttack(target, spellName);
};

// Register arena API when mounted
onMounted(async () => {
  const arena = arenaRef.value;
  if (!arena || !('getContainer' in arena) || !('init' in arena)) return;
  registerArena(arena as CombatArenaApi);
  const container = arena.getContainer();
  if (!container) return;
  await arena.init(container);

  if (inCombat.value) {
    await initializeVisual();
  } else {
    await arena.createUnit('demo-player', 2, 4, 3, 'Archer-Green', 100, 100, true);
    await arena.createUnit('demo-enemy', 8, 4, 2, 'Soldier-Red', 50, 50, false);
    arena.setupDragEvents();
  }
});

// Watch only for combat starting (inCombat changing from false to true)
watch(
  () => combatApi.isInCombat.value,
  async (inCombatNow, wasInCombat) => {
    if (!inCombatNow || wasInCombat || !arenaRef.value) return;
    // Only initialize when combat STARTS, not on every state change
    await new Promise(resolve => setTimeout(resolve, 100));
    await initializeVisual();
  },
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
