<template>
  <div>
    <CombatArena
      ref="combatarena"
      :manual-init="true"
    >
      <div
        ref="pixiContainer"
        class="pixi-container"
      />
    </CombatArena>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import CombatArena from './CombatArena.vue';

const combatarena = ref<InstanceType<typeof CombatArena>>();
const pixiContainer = ref<HTMLDivElement | null>(null);
onMounted(async () => {
  if (!combatarena.value || !pixiContainer.value) return;
  await combatarena.value.init(pixiContainer.value);

  combatarena.value.createUnit('player', 1, 5, 3, 'Archer-Green', 100, 100);
  combatarena.value.createUnit('enemy-1', 5, 1, 3, 'Soldier-Red', 50, 50);

  combatarena.value.setupDragEvents();
});
</script>
