<script setup lang="ts">
import { ref } from 'vue'
import CombatGrid from './components/CombatGrid.vue'
import type { UnitToken } from './types'

// ─────────────────────────────────────────────────────────────
// Example Data
// ─────────────────────────────────────────────────────────────

// 7x7 map: 0 = grass, 1 = obstacle/tree
const mapData = ref<number[][]>([
  [0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1],
  [0, 0, 0, 0, 0, 1, 1],
])

// Units: player + enemies
const units = ref<UnitToken[]>([
  { id: 'player-1', x: 1, y: 5, isPlayer: true, color: '#4ade80', moves: 3 },
  { id: 'enemy-1', x: 5, y: 1, isPlayer: false, color: '#f87171' },
  { id: 'enemy-2', x: 4, y: 4, isPlayer: false, color: '#fb923c' },
])

// ─────────────────────────────────────────────────────────────
// Event Handlers
// ─────────────────────────────────────────────────────────────
function onCellClicked(payload: { x: number; y: number }) {
  console.log('Cell clicked:', payload)
}

function onUnitClicked(payload: UnitToken) {
  console.log('Unit clicked:', payload)
}

function onUnitMoved(payload: { id: string; x: number; y: number }) {
  console.log('Unit moved:', payload)
  // Update local units state to keep in sync
  const idx = units.value.findIndex((u) => u.id === payload.id)
  if (idx !== -1) {
    units.value[idx] = { ...units.value[idx], x: payload.x, y: payload.y }
  }
}
</script>

<template>
  <main class="demo-container">
    <h1>🎲 Combat Grid Demo</h1>
    <p class="instructions">
      Déplacez le jeton vert (joueur) en le faisant glisser. Cliquez sur un ennemi pour déclencher
      une alerte. Les cases bleues indiquent les cases accessibles.
    </p>

    <CombatGrid
      :map-data="mapData"
      :units="units"
      :max-moves="3"
      background-image="/map.png"
      @cell-clicked="onCellClicked"
      @unit-clicked="onUnitClicked"
      @unit-moved="onUnitMoved"
    />

    <section class="legend">
      <h2>Légende</h2>
      <ul>
        <li><span class="swatch player"></span> Joueur (déplaçable, 3 cases max)</li>
        <li><span class="swatch enemy1"></span> Ennemi 1</li>
        <li><span class="swatch enemy2"></span> Ennemi 2</li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.demo-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #e4e4e7;
}

h1 {
  margin-bottom: 0.5rem;
}

.instructions {
  max-width: 420px;
  text-align: center;
  margin-bottom: 1.5rem;
  color: #a1a1aa;
  font-size: 0.95rem;
}

.legend {
  margin-top: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem 1.5rem;
  border-radius: 8px;
}

.legend h2 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.legend ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.legend li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #fff;
}

.swatch.player {
  background: #4ade80;
}

.swatch.enemy1 {
  background: #f87171;
}

.swatch.enemy2 {
  background: #fb923c;
}
</style>
