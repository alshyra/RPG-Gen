<!-- packages/frontend/src/components/game/combat-panel/CombatPanel.vue -->
<template>
  <div
    v-if="inCombat"
    class="combat-wrapper"
  >
    <!-- Header avec infos turn/actions (gardé tel quel) -->
    <CombatHeader />

    <!-- NOUVEAU : Arène visuelle PixiJS -->
    <CombatArena
      ref="arenaRef"
      :combat-state="combatState"
      @unit-moved="handleUnitMoved"
      @unit-attacked="handleUnitAttacked"
    />

    <!-- Ancien ParticipantsGrid remplacé ou gardé comme fallback -->
  </div>
</template>

<script setup lang="ts">
import { CombatArena } from '@rpg-gen/combat-engine';
import { useCombatEngine } from '@/composables/useCombatEngine';

const {
  executeAttack, moveUnit,
} = useCombatEngine();

const handleUnitMoved = async (payload: { unitId: string;
  to: GridPosition; }) => {
  // Le moteur visuel a déjà animé, on valide avec le backend si besoin
  console.log('Unit moved visually:', payload);
};

const handleUnitAttacked = async (payload: { attackerId: string;
  targetId: string; }) => {
  const target = combatStore.enemies.find(e => e.id === payload.targetId);
  if (target) {
    await executeAttack(target);
  }
};
</script>
