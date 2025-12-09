<template>
  <div class="combat-arena">
    <div
      ref="pixiContainer"
      class="pixi-container"
    />
    <button
      class="move-button"
      @click="testMove"
    >
      Test Move
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePixiCombat } from './composable/usePixiCombat';

// Utiliser le composable
const { init, createUnit, moveUnit } = usePixiCombat();

// Références
const pixiContainer = ref<HTMLElement | null>(null);
const playerUnitId = ref('player1');

// Initialisation au montage
onMounted(async () => {
  if (pixiContainer.value) {
    await init(pixiContainer.value);

    // Créer une unité de joueur
    const player = createUnit(playerUnitId.value, 400, 300);

    if (player) {
      console.log('Unité créée avec succès !');
    }
  }
});

// Fonction de test de mouvement
const testMove = () => {
  // Déplacer l'unité du point A (400, 300) au point B (600, 400)
  moveUnit(playerUnitId.value, 600, 400);
};
</script>

<style scoped>
.combat-arena {
  position: relative;
  width: 800px;
  height: 600px;
  margin: 20px auto;
  border: 2px solid #333;
  border-radius: 8px;
  overflow: hidden;
}

.pixi-container {
  width: 100%;
  height: 100%;
}

.move-button {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.move-button:hover {
  background-color: #45a049;
}
</style>
