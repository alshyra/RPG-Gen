<template>
  <div>
    <CombatArena
      ref="combatarena"
      :manual-init="true"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import CombatArena from './CombatArena.vue';

const combatarena = ref<InstanceType<typeof CombatArena>>();

onMounted(async () => {
  if (!combatarena.value) return;

  // Get the internal container from CombatArena
  const container = combatarena.value.getContainer();
  if (!container) return;

  await combatarena.value.init(container);

  await combatarena.value.createUnit('player', 1, 5, 3, 'Archer-Green', 100, 100);
  await combatarena.value.createUnit('enemy-1', 5, 1, 3, 'Soldier-Red', 50, 50);

  combatarena.value.setupDragEvents();
});
</script>
