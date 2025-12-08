<script setup lang="ts">
import { ref } from 'vue'
import CombatGrid from './components/CombatGrid.vue'
import type { UnitToken, AttackResult } from './types'

// ─────────────────────────────────────────────────────────────
// Example Data
// ─────────────────────────────────────────────────────────────

// 12x12 map: 0 = grass, 1 = obstacle/tree
const mapData = ref<number[][]>(
  Array.from({ length: 12 }, (_, row) =>
    Array.from({ length: 12 }, (_, col) => {
      // Some scattered obstacles
      if ((row === 0 || row === 1) && col === 3) return 1
      if (row >= 5 && row <= 6 && (col === 5 || col === 6 || col === 8 || col === 9)) return 1
      if (row >= 8 && row <= 9 && (col === 5 || col === 6 || col === 8 || col === 9)) return 1
      return 0
    })
  )
)

// Units: player + enemies with sprite URLs and HP
// Using placeholder sprite paths - replace with actual sprite paths
const SPRITE_BASE = '/puny-characters'

const units = ref<UnitToken[]>([
  {
    id: 'player-1',
    x: 1,
    y: 5,
    isPlayer: true,
    color: '#4ade80',
    moves: 3,
    spriteUrl: `${SPRITE_BASE}/Soldier-Blue.png`,
    hp: 100,
    hpMax: 100,
    isDead: false,
  },
  {
    id: 'enemy-1',
    x: 5,
    y: 1,
    isPlayer: false,
    color: '#f87171',
    spriteUrl: `${SPRITE_BASE}/Soldier-Red.png`,
    hp: 50,
    hpMax: 50,
    isDead: false,
  },
  {
    id: 'enemy-2',
    x: 4,
    y: 4,
    isPlayer: false,
    color: '#fb923c',
    spriteUrl: `${SPRITE_BASE}/Warrior-Red.png`,
    hp: 75,
    hpMax: 75,
    isDead: false,
  },
])

// Ref to the CombatGrid component
const combatGridRef = ref<InstanceType<typeof CombatGrid> | null>(null)

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
  const current = units.value.find((u) => u.id === payload.id)
  if (!current) return

  const idx = units.value.findIndex((u) => u.id === payload.id)
  units.value[idx] = {
    ...current,
    id: current.id,
    x: payload.x,
    y: payload.y,
    isPlayer: current.isPlayer,
    spriteUrl: current.spriteUrl,
  }
}

function onUnitAttack(payload: { attackerId: string; targetId: string; attackType: string }) {
  console.log('Attack:', payload)

  const target = units.value.find((u) => u.id === payload.targetId)
  if (!target || target.hp === undefined || target.hpMax === undefined) return

  // Simulate attack result (in a real game, this would come from backend)
  const roll = Math.random()
  const hit = roll > 0.2 // 80% hit chance
  const isCrit = hit && roll > 0.9 // 10% crit chance (of total)

  let baseDamage = 0
  switch (payload.attackType) {
    case 'Sword':
      baseDamage = 15
      break
    case 'Bow':
      baseDamage = 12
      break
    case 'Stave':
      baseDamage = 10
      break
    case 'Throw':
      baseDamage = 8
      break
    default:
      baseDamage = 10
  }

  const damageTotal = hit ? (isCrit ? baseDamage * 2 : baseDamage) : 0
  const targetHpAfter = Math.max(0, target.hp - damageTotal)
  const targetDefeated = targetHpAfter === 0

  const result: AttackResult = {
    attackerId: payload.attackerId,
    targetId: payload.targetId,
    attackType: payload.attackType,
    hit,
    isCrit,
    damageTotal,
    targetHpBefore: target.hp,
    targetHpAfter,
    targetDefeated,
  }

  console.log('Attack result:', result)

  // Apply the result to the combat grid
  combatGridRef.value?.applyAttackResult(result)

  // Update our local units state
  const current = units.value.find((u) => u.id === payload.targetId)
  if (!current) return

  const idx = units.value.findIndex((u) => u.id === payload.targetId)
  units.value[idx] = {
    ...current,
    id: current.id,
    x: current.x,
    y: current.y,
    isPlayer: current.isPlayer,
    spriteUrl: current.spriteUrl,
    hp: targetHpAfter,
    isDead: targetDefeated,
  }
}

function onAnimationEnd(payload: { id: string; animationName: string }) {
  console.log('Animation ended:', payload)
}

function onDamagePopupEnd(payload: { id: string; popupId: string }) {
  console.log('Damage popup ended:', payload)
}
</script>

<template>
  <main class="demo-container">
    <h1>🎲 Combat Grid Demo</h1>
    <p class="instructions">
      Déplacez le jeton vert (joueur) en le faisant glisser. Cliquez sur un ennemi pour attaquer.
      Les cases bleues indiquent les cases accessibles.
    </p>

    <CombatGrid
      ref="combatGridRef"
      :map-data="mapData"
      :units="units"
      :max-moves="3"
      :grid-cols="12"
      :grid-rows="12"
      :cell-size="48"
      background-image="/map.png"
      @cell-clicked="onCellClicked"
      @unit-clicked="onUnitClicked"
      @unit-moved="onUnitMoved"
      @unit-attack="onUnitAttack"
      @animation-end="onAnimationEnd"
      @damage-popup-end="onDamagePopupEnd"
    />

    <section class="legend">
      <h2>Légende</h2>
      <ul>
        <li><span class="swatch player"></span> Joueur (déplaçable, 3 cases max)</li>
        <li><span class="swatch enemy1"></span> Ennemi 1 (50 HP)</li>
        <li><span class="swatch enemy2"></span> Ennemi 2 (75 HP)</li>
      </ul>
      <p class="attack-hint">💡 Cliquez sur un ennemi pour l'attaquer (Épée si adjacent, Arc sinon)</p>
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

.attack-hint {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: #9ca3af;
  text-align: center;
}
</style>
