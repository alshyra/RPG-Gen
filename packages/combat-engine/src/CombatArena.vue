<template>
  <div class="combat-arena">
    <div
      ref="pixiContainer"
      class="pixi-container"
    />
    <div class="instructions">
      <p>🎮 Cliquez et glissez votre personnage (max 3 cases)</p>
      <p>✨ Les cases vertes indiquent la portée de déplacement</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePixiCombat } from './composable/usePixiCombat';

// Utiliser le composable
const { init, createUnit, setupDragEvents } = usePixiCombat();

// Références
const pixiContainer = ref <HTMLDivElement | null> (null);
const playerUnitId = ref('player1');
const enemyUnitId = ref('enemy1');

// Initialisation au montage
onMounted(async () => {
  if (!pixiContainer.value) return;
  await init(pixiContainer.value);

  await createUnit(playerUnitId.value, 6, 4, 3, 'Archer-Green');
  
  await createUnit(enemyUnitId.value, 2, 4, 3, 'Warrior-Red');
  setupDragEvents();
});
</script>

<style scoped>
.combat-arena {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin: 20px auto;
  padding: 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.pixi-container {
  border: 3px solid #0f3460;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}

.instructions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.instructions p {
  margin: 0;
  color: #e0e0e0;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}
</style>
