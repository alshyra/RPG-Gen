<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Konva from 'konva'
import type { UnitToken, AttackResult, SpriteManifest } from '../types'
import { useCombatGridStore } from '../stores/useCombatGridStore'
import AttackMenu from './AttackMenu.vue'

// ─────────────────────────────────────────────────────────────
// Props & Emits
// ─────────────────────────────────────────────────────────────
const props = withDefaults(
  defineProps<{
    mapData: number[][]
    units: UnitToken[]
    maxMoves?: number
    backgroundImage?: string
    gridCols?: number
    gridRows?: number
    cellSize?: number
  }>(),
  {
    maxMoves: 3,
    backgroundImage: '/map.png',
    gridCols: 12,
    gridRows: 12,
    cellSize: 48,
  }
)

const emit = defineEmits<{
  (e: 'cell-clicked', payload: { x: number; y: number }): void
  (e: 'unit-clicked', payload: UnitToken): void
  (e: 'unit-moved', payload: { id: string; x: number; y: number }): void
  (e: 'unit-attack', payload: { attackerId: string; targetId: string; attackType: string }): void
  (e: 'animation-end', payload: { id: string; animationName: string }): void
  (e: 'damage-popup-end', payload: { id: string; popupId: string }): void
}>()

// ─────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────
const store = useCombatGridStore()

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const SPRITE_DISPLAY_SIZE = 32

// Colors for terrain types
const TERRAIN_COLORS: Record<number, string> = {
  0: 'rgba(144, 238, 144, 0.25)', // grass
  1: 'rgba(210, 180, 140, 0.5)',  // dirt/obstacle
}

// ─────────────────────────────────────────────────────────────
// Refs / State
// ─────────────────────────────────────────────────────────────
const containerRef = ref<HTMLDivElement | null>(null)
let stage: Konva.Stage | null = null
let bgLayer: Konva.Layer | null = null
let gridLayer: Konva.Layer | null = null
let highlightLayer: Konva.Layer | null = null
let tokenLayer: Konva.Layer | null = null
let healthLayer: Konva.Layer | null = null
let popupLayer: Konva.Layer | null = null

// Local copy of units for internal state (position updates)
const unitsLocal = ref<UnitToken[]>([])

// Token Konva nodes
const unitNodes = new Map<string, Konva.Image>()
const hpNodes = new Map<string, { bg: Konva.Rect; fg: Konva.Rect; text: Konva.Text }>()

// Currently selected/dragged player unit
const selectedUnitId = ref<string | null>(null)
const dragStartPos = ref<{ x: number; y: number } | null>(null)

// Animation engine
let animationFrameId: number | null = null

// Attack menu state
const attackMenuVisible = ref(false)
const attackMenuX = ref(0)
const attackMenuY = ref(0)
const attackMenuOptions = ref<string[]>([])
const attackMenuDefaultChoice = ref('Sword')
const pendingAttack = ref<{ attackerId: string; targetId: string } | null>(null)

// ─────────────────────────────────────────────────────────────
// Computed helpers
// ─────────────────────────────────────────────────────────────
function stageSize() {
  return {
    width: props.gridCols * props.cellSize,
    height: props.gridRows * props.cellSize,
  }
}

function cellCenter(cellX: number, cellY: number) {
  return {
    x: cellX * props.cellSize + props.cellSize / 2,
    y: cellY * props.cellSize + props.cellSize / 2,
  }
}

function pixelToCell(px: number, py: number) {
  return {
    x: Math.max(0, Math.min(props.gridCols - 1, Math.floor(px / props.cellSize))),
    y: Math.max(0, Math.min(props.gridRows - 1, Math.floor(py / props.cellSize))),
  }
}

function manhattanDistance(ax: number, ay: number, bx: number, by: number) {
  return Math.abs(ax - bx) + Math.abs(ay - by)
}

function getUnitMoveRange(unit: UnitToken) {
  return unit.moves ?? props.maxMoves
}

function getManifest(unit: UnitToken): SpriteManifest {
  return store.getOrCreateManifest(unit.spriteUrl, {
    frameWidth: unit.frameWidth,
    frameHeight: unit.frameHeight,
    rows: unit.rows,
    cols: unit.cols,
    frameRate: unit.frameRate,
    animations: unit.animations,
  })
}

function getPlayerUnit(): UnitToken | undefined {
  return unitsLocal.value.find((u) => u.isPlayer)
}

// ─────────────────────────────────────────────────────────────
// Drawing: Grid
// ─────────────────────────────────────────────────────────────
function drawGrid() {
  if (!gridLayer) return
  gridLayer.destroyChildren()

  for (let row = 0; row < props.gridRows; row++) {
    for (let col = 0; col < props.gridCols; col++) {
      const terrainType = props.mapData[row]?.[col] ?? 0
      const rect = new Konva.Rect({
        x: col * props.cellSize,
        y: row * props.cellSize,
        width: props.cellSize,
        height: props.cellSize,
        fill: TERRAIN_COLORS[terrainType] ?? TERRAIN_COLORS[0],
        stroke: 'rgba(0,0,0,0.3)',
        strokeWidth: 1,
      })
      rect.on('click tap', () => {
        emit('cell-clicked', { x: col, y: row })
      })
      gridLayer.add(rect)
    }
  }
  gridLayer.batchDraw()
}

// ─────────────────────────────────────────────────────────────
// Drawing: Highlights (reachable cells)
// ─────────────────────────────────────────────────────────────
function drawHighlights(originX: number, originY: number, range: number) {
  if (!highlightLayer) return
  highlightLayer.destroyChildren()

  for (let row = 0; row < props.gridRows; row++) {
    for (let col = 0; col < props.gridCols; col++) {
      const dist = manhattanDistance(originX, originY, col, row)
      if (dist > 0 && dist <= range) {
        const rect = new Konva.Rect({
          x: col * props.cellSize,
          y: row * props.cellSize,
          width: props.cellSize,
          height: props.cellSize,
          fill: 'rgba(100, 149, 237, 0.35)',
          listening: false,
        })
        highlightLayer.add(rect)
      }
    }
  }
  highlightLayer.batchDraw()
}

function clearHighlights() {
  if (!highlightLayer) return
  highlightLayer.destroyChildren()
  highlightLayer.batchDraw()
}

// ─────────────────────────────────────────────────────────────
// Drawing: HP Bars
// ─────────────────────────────────────────────────────────────
const HP_BAR_WIDTH = 36
const HP_BAR_HEIGHT = 5
const HP_BAR_OFFSET_Y = -22

function drawHpBars() {
  if (!healthLayer) return
  healthLayer.destroyChildren()
  hpNodes.clear()

  for (const unit of unitsLocal.value) {
    if (unit.hp === undefined || unit.hpMax === undefined) continue

    const { x: cx, y: cy } = cellCenter(unit.x, unit.y)
    const barX = cx - HP_BAR_WIDTH / 2
    const barY = cy - SPRITE_DISPLAY_SIZE / 2 + HP_BAR_OFFSET_Y

    // Background
    const bg = new Konva.Rect({
      x: barX,
      y: barY,
      width: HP_BAR_WIDTH,
      height: HP_BAR_HEIGHT,
      fill: '#1f2937',
      cornerRadius: 2,
      stroke: '#374151',
      strokeWidth: 1,
    })

    // Foreground (health)
    const hpRatio = Math.max(0, Math.min(1, unit.hp / unit.hpMax))
    const fg = new Konva.Rect({
      x: barX + 1,
      y: barY + 1,
      width: (HP_BAR_WIDTH - 2) * hpRatio,
      height: HP_BAR_HEIGHT - 2,
      fill: hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444',
      cornerRadius: 1,
    })

    // Text
    const text = new Konva.Text({
      x: barX,
      y: barY - 10,
      width: HP_BAR_WIDTH,
      text: `${unit.hp}/${unit.hpMax}`,
      fontSize: 9,
      fontFamily: 'monospace',
      fill: '#e2e8f0',
      align: 'center',
    })

    healthLayer.add(bg)
    healthLayer.add(fg)
    healthLayer.add(text)
    hpNodes.set(unit.id, { bg, fg, text })
  }

  healthLayer.batchDraw()
}

function updateHpBar(unitId: string, hp: number, hpMax: number) {
  const nodes = hpNodes.get(unitId)
  if (!nodes) return

  const hpRatio = Math.max(0, Math.min(1, hp / hpMax))
  const targetWidth = (HP_BAR_WIDTH - 2) * hpRatio
  const newColor = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444'

  nodes.fg.to({
    width: targetWidth,
    duration: 0.3,
    easing: Konva.Easings.EaseOut,
  })
  nodes.fg.fill(newColor)
  nodes.text.text(`${hp}/${hpMax}`)
  healthLayer?.batchDraw()
}

function updateHpBarPosition(unitId: string, cellX: number, cellY: number) {
  const nodes = hpNodes.get(unitId)
  if (!nodes) return

  const { x: cx, y: cy } = cellCenter(cellX, cellY)
  const barX = cx - HP_BAR_WIDTH / 2
  const barY = cy - SPRITE_DISPLAY_SIZE / 2 + HP_BAR_OFFSET_Y

  nodes.bg.x(barX)
  nodes.bg.y(barY)
  nodes.fg.x(barX + 1)
  nodes.fg.y(barY + 1)
  nodes.text.x(barX)
  nodes.text.y(barY - 10)
}

// ─────────────────────────────────────────────────────────────
// Drawing: Damage Popups
// ─────────────────────────────────────────────────────────────
function showDamagePopup(targetId: string, result: AttackResult) {
  if (!popupLayer) return

  const unit = unitsLocal.value.find((u) => u.id === targetId)
  if (!unit) return

  const { x: cx, y: cy } = cellCenter(unit.x, unit.y)

  let text: string
  let color: string
  let scale = 1

  if (!result.hit) {
    text = 'MISS'
    color = '#9ca3af'
  } else if (result.isCrit) {
    text = `CRIT -${result.damageTotal}`
    color = '#fbbf24'
    scale = 1.3
  } else {
    text = `-${result.damageTotal}`
    color = '#f87171'
  }

  const popup = store.createPopup(targetId, text, color, 800, scale)

  const textNode = new Konva.Text({
    x: cx,
    y: cy - SPRITE_DISPLAY_SIZE / 2 - 30,
    text,
    fontSize: 14 * scale,
    fontFamily: 'monospace',
    fontStyle: 'bold',
    fill: color,
    align: 'center',
    offsetX: 0,
    opacity: 1,
  })
  textNode.offsetX(textNode.width() / 2)
  popupLayer.add(textNode)
  popupLayer.batchDraw()

  // Animate upward + fade
  textNode.to({
    y: textNode.y() - 24,
    opacity: 0,
    duration: 0.8,
    easing: Konva.Easings.EaseOut,
    onFinish: () => {
      textNode.destroy()
      store.removePopup(targetId, popup.id)
      emit('damage-popup-end', { id: targetId, popupId: popup.id })
      popupLayer?.batchDraw()
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Drawing: Tokens (Sprites)
// ─────────────────────────────────────────────────────────────
async function drawTokens() {
  if (!tokenLayer) return
  tokenLayer.destroyChildren()
  unitNodes.clear()

  for (const unit of unitsLocal.value) {
    const img = store.spritesMap.value.get(unit.spriteUrl)
    if (!img) {
      console.warn(`[CombatGrid] Sprite not loaded for unit ${unit.id}: ${unit.spriteUrl}`)
      continue
    }

    const manifest = getManifest(unit)
    const { x: cx, y: cy } = cellCenter(unit.x, unit.y)

    // Get current animation state or default to Idle
    let anim = store.getAnimation(unit.id)
    if (!anim) {
      store.addAnimation(unit.id, 'Idle', manifest)
      anim = store.getAnimation(unit.id)!
    }

    const frameCol = anim.cols[anim.frameIndex % anim.cols.length] ?? 0

    const konvaImg = new Konva.Image({
      image: img,
      x: cx - SPRITE_DISPLAY_SIZE / 2,
      y: cy - SPRITE_DISPLAY_SIZE / 2,
      width: SPRITE_DISPLAY_SIZE,
      height: SPRITE_DISPLAY_SIZE,
      crop: {
        x: frameCol * manifest.frameWidth,
        y: anim.row * manifest.frameHeight,
        width: manifest.frameWidth,
        height: manifest.frameHeight,
      },
      draggable: unit.isPlayer && !unit.isDead,
      id: unit.id,
      shadowColor: 'black',
      shadowBlur: 4,
      shadowOffset: { x: 2, y: 2 },
      shadowOpacity: 0.4,
      opacity: unit.isDead ? 0.6 : 1,
    })

    // Click handler
    konvaImg.on('click tap', (e) => {
      e.cancelBubble = true
      emit('unit-clicked', unit)

      // If clicking an enemy and there's a player, show attack menu
      if (!unit.isPlayer && !unit.isDead) {
        const player = getPlayerUnit()
        if (player && !player.isDead) {
          showAttackMenu(player, unit)
        }
      }
    })

    if (unit.isPlayer && !unit.isDead) {
      // Drag start
      konvaImg.on('dragstart', () => {
        selectedUnitId.value = unit.id
        dragStartPos.value = { x: unit.x, y: unit.y }
        const range = getUnitMoveRange(unit)
        drawHighlights(unit.x, unit.y, range)
        konvaImg.moveToTop()

        // Switch to Walk animation
        store.addAnimation(unit.id, 'Walk', getManifest(unit))
      })

      // Drag move — clamp inside stage
      konvaImg.on('dragmove', () => {
        const pos = konvaImg.position()
        const { width, height } = stageSize()
        const half = SPRITE_DISPLAY_SIZE / 2
        const clampedX = Math.max(half, Math.min(width - half, pos.x + half)) - half
        const clampedY = Math.max(half, Math.min(height - half, pos.y + half)) - half
        konvaImg.position({ x: clampedX, y: clampedY })

        // Update HP bar position during drag
        const cell = pixelToCell(clampedX + half, clampedY + half)
        updateHpBarPosition(unit.id, cell.x, cell.y)
        healthLayer?.batchDraw()
      })

      // Drag end — snap with lerp
      konvaImg.on('dragend', () => {
        const pos = konvaImg.position()
        const targetCell = pixelToCell(pos.x + SPRITE_DISPLAY_SIZE / 2, pos.y + SPRITE_DISPLAY_SIZE / 2)
        const startCell = dragStartPos.value ?? { x: unit.x, y: unit.y }
        const dist = manhattanDistance(startCell.x, startCell.y, targetCell.x, targetCell.y)
        const range = getUnitMoveRange(unit)

        let finalCell: { x: number; y: number }
        if (dist <= range) {
          finalCell = targetCell
        } else {
          finalCell = startCell
        }

        const { x: fx, y: fy } = cellCenter(finalCell.x, finalCell.y)

        konvaImg.to({
          x: fx - SPRITE_DISPLAY_SIZE / 2,
          y: fy - SPRITE_DISPLAY_SIZE / 2,
          duration: 0.2,
          easing: Konva.Easings.EaseOut,
          onFinish: () => {
            const current = unitsLocal.value.find((u) => u.id === unit.id)
            if (current) {
              const idx = unitsLocal.value.findIndex((u) => u.id === unit.id)
              unitsLocal.value[idx] = {
                ...current,
                id: current.id,
                x: finalCell.x,
                y: finalCell.y,
                isPlayer: current.isPlayer,
                spriteUrl: current.spriteUrl,
              }
            }
            if (finalCell.x !== startCell.x || finalCell.y !== startCell.y) {
              emit('unit-moved', { id: unit.id, x: finalCell.x, y: finalCell.y })
            }
            clearHighlights()
            selectedUnitId.value = null
            dragStartPos.value = null

            // Switch back to Idle
            store.addAnimation(unit.id, 'Idle', getManifest(unit))

            // Update HP bar to final position
            updateHpBarPosition(unit.id, finalCell.x, finalCell.y)
            healthLayer?.batchDraw()
          },
        })
      })
    }

    tokenLayer.add(konvaImg)
    unitNodes.set(unit.id, konvaImg)
  }
  tokenLayer.batchDraw()
}

// ─────────────────────────────────────────────────────────────
// Attack Menu
// ─────────────────────────────────────────────────────────────
function showAttackMenu(attacker: UnitToken, target: UnitToken) {
  const dist = manhattanDistance(attacker.x, attacker.y, target.x, target.y)
  const options: string[] = []

  // Melee if adjacent
  if (dist <= 1) {
    options.push('Sword')
  }
  // Ranged if not adjacent
  if (dist > 1) {
    options.push('Bow')
  }
  // Always allow magic options
  options.push('Stave', 'Throw')

  attackMenuOptions.value = options
  attackMenuDefaultChoice.value = dist <= 1 ? 'Sword' : 'Bow'
  pendingAttack.value = { attackerId: attacker.id, targetId: target.id }

  // Position menu near the click
  const pointerPos = stage?.getPointerPosition()
  if (pointerPos && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    attackMenuX.value = rect.left + pointerPos.x + 10
    attackMenuY.value = rect.top + pointerPos.y - 20
  }

  attackMenuVisible.value = true
}

function onAttackChosen(attackType: string) {
  attackMenuVisible.value = false
  if (!pendingAttack.value) return

  const { attackerId, targetId } = pendingAttack.value
  pendingAttack.value = null

  // Play attack animation
  const attacker = unitsLocal.value.find((u) => u.id === attackerId)
  if (attacker) {
    store.addAnimation(attackerId, attackType, getManifest(attacker), { once: true })
  }

  // Emit attack event to parent
  emit('unit-attack', { attackerId, targetId, attackType })
}

function onAttackCancelled() {
  attackMenuVisible.value = false
  pendingAttack.value = null
}

// ─────────────────────────────────────────────────────────────
// Public method: Apply attack result (called by parent)
// ─────────────────────────────────────────────────────────────
function applyAttackResult(result: AttackResult) {
  // Show damage popup
  showDamagePopup(result.targetId, result)

  // Update target HP in local state
  const target = unitsLocal.value.find((u) => u.id === result.targetId)
  if (!target) return

  const targetIdx = unitsLocal.value.findIndex((u) => u.id === result.targetId)
  unitsLocal.value[targetIdx] = {
    ...target,
    id: target.id,
    x: target.x,
    y: target.y,
    isPlayer: target.isPlayer,
    spriteUrl: target.spriteUrl,
    hp: result.targetHpAfter,
    isDead: result.targetDefeated,
  }

  // Update HP bar
  updateHpBar(result.targetId, result.targetHpAfter, target.hpMax ?? result.targetHpBefore)

  // Play hurt or death animation
  const manifest = getManifest(target)
  if (result.targetDefeated) {
    store.addAnimation(result.targetId, 'Death', manifest, { once: true })
  } else if (result.hit) {
    store.addAnimation(result.targetId, 'Hurt', manifest, { once: true })
  }
}

// Expose for parent to call
defineExpose({ applyAttackResult })

// ─────────────────────────────────────────────────────────────
// Animation Engine
// ─────────────────────────────────────────────────────────────
function startAnimationEngine() {
  const tick = (now: number) => {
    let needsRedraw = false

    for (const [unitId, anim] of Object.entries(store.activeAnimations.value)) {
      const elapsed = now - anim.lastTs
      const frameDuration = 1000 / anim.frameRate

      if (elapsed >= frameDuration) {
        anim.lastTs = now
        anim.frameIndex++

        // Check if animation finished
        if (anim.frameIndex >= anim.cols.length) {
          if (anim.loop) {
            anim.frameIndex = 0
          } else {
            // Non-looping animation finished
            anim.frameIndex = anim.cols.length - 1 // Stay on last frame

            if (anim.once) {
              // Emit animation end and switch back to Idle (unless Death)
              emit('animation-end', { id: unitId, animationName: anim.animationName })

              if (anim.animationName !== 'Death') {
                const unit = unitsLocal.value.find((u) => u.id === unitId)
                if (unit) {
                  store.addAnimation(unitId, 'Idle', getManifest(unit))
                }
              }
            }
          }
        }

        // Update the Konva image crop
        const node = unitNodes.get(unitId)
        const unit = unitsLocal.value.find((u) => u.id === unitId)
        if (node && unit) {
          const manifest = getManifest(unit)
          const frameCol = anim.cols[anim.frameIndex % anim.cols.length] ?? 0
          node.crop({
            x: frameCol * manifest.frameWidth,
            y: anim.row * manifest.frameHeight,
            width: manifest.frameWidth,
            height: manifest.frameHeight,
          })
          needsRedraw = true
        }
      }
    }

    if (needsRedraw) {
      tokenLayer?.batchDraw()
    }

    animationFrameId = requestAnimationFrame(tick)
  }

  animationFrameId = requestAnimationFrame(tick)
}

function stopAnimationEngine() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// ─────────────────────────────────────────────────────────────
// Sprite Preloading
// ─────────────────────────────────────────────────────────────
async function preloadSprites() {
  const urls = new Set(props.units.map((u) => u.spriteUrl))
  const promises = Array.from(urls).map((url) => store.loadSprite(url).catch(() => null))
  await Promise.all(promises)
}

// ─────────────────────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────────────────────
async function initKonva() {
  if (!containerRef.value) return

  const { width, height } = stageSize()

  stage = new Konva.Stage({
    container: containerRef.value,
    width,
    height,
  })

  // Background layer
  bgLayer = new Konva.Layer()
  stage.add(bgLayer)

  const bgImage = new Image()
  bgImage.src = props.backgroundImage
  bgImage.onload = () => {
    const konvaImg = new Konva.Image({
      image: bgImage,
      x: 0,
      y: 0,
      width,
      height,
    })
    bgLayer!.add(konvaImg)
    bgLayer!.moveToBottom()
    bgLayer!.batchDraw()
  }

  // Grid layer
  gridLayer = new Konva.Layer()
  stage.add(gridLayer)

  // Highlight layer
  highlightLayer = new Konva.Layer()
  stage.add(highlightLayer)

  // Token layer
  tokenLayer = new Konva.Layer()
  stage.add(tokenLayer)

  // Health layer
  healthLayer = new Konva.Layer()
  stage.add(healthLayer)

  // Popup layer
  popupLayer = new Konva.Layer()
  stage.add(popupLayer)

  // Preload sprites
  await preloadSprites()

  // Initial draw
  drawGrid()
  await drawTokens()
  drawHpBars()

  // Start animation engine
  startAnimationEngine()
}

// ─────────────────────────────────────────────────────────────
// Lifecycle
// ─────────────────────────────────────────────────────────────
onMounted(async () => {
  unitsLocal.value = props.units.map((u) => ({ ...u }))
  await initKonva()
})

onUnmounted(() => {
  stopAnimationEngine()
  stage?.destroy()
})

// Watch for prop changes
watch(
  () => props.units,
  async (newUnits) => {
    // Detect HP changes for existing units
    for (const newUnit of newUnits) {
      const oldUnit = unitsLocal.value.find((u) => u.id === newUnit.id)
      if (oldUnit && oldUnit.hp !== newUnit.hp && newUnit.hp !== undefined && newUnit.hpMax !== undefined) {
        updateHpBar(newUnit.id, newUnit.hp, newUnit.hpMax)
      }
    }

    unitsLocal.value = newUnits.map((u) => ({ ...u }))
    await preloadSprites()
    await drawTokens()
    drawHpBars()
  },
  { deep: true }
)

watch(
  () => props.mapData,
  () => {
    drawGrid()
  },
  { deep: true }
)
</script>

<template>
  <div class="combat-grid-wrapper">
    <div ref="containerRef" class="combat-grid-container"></div>
    <AttackMenu
      :x="attackMenuX"
      :y="attackMenuY"
      :options="attackMenuOptions"
      :visible="attackMenuVisible"
      :default-choice="attackMenuDefaultChoice"
      @choose="onAttackChosen"
      @cancel="onAttackCancelled"
    />
  </div>
</template>

<style scoped>
.combat-grid-wrapper {
  position: relative;
}

.combat-grid-container {
  width: v-bind("`${gridCols * cellSize}px`");
  height: v-bind("`${gridRows * cellSize}px`");
  border: 2px solid #333;
  border-radius: 4px;
  overflow: hidden;
  background: #1a1a2e;
}
</style>
