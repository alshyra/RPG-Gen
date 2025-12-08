<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Konva from 'konva'
import type { UnitToken } from '../types'

// ─────────────────────────────────────────────────────────────
// Props & Emits
// ─────────────────────────────────────────────────────────────
const props = withDefaults(
  defineProps<{
    mapData: number[][]
    units: UnitToken[]
    maxMoves?: number
    backgroundImage?: string
  }>(),
  {
    maxMoves: 3,
    backgroundImage: '/map.png',
  }
)

const emit = defineEmits<{
  (e: 'cell-clicked', payload: { x: number; y: number }): void
  (e: 'unit-clicked', payload: UnitToken): void
  (e: 'unit-moved', payload: { id: string; x: number; y: number }): void
}>()

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const GRID_SIZE = 7
const CELL_SIZE = 60
const STAGE_SIZE = GRID_SIZE * CELL_SIZE // 420

// Colors for terrain types
const TERRAIN_COLORS: Record<number, string> = {
  0: 'rgba(144, 238, 144, 0.35)', // grass (semi-transparent to show bg)
  1: 'rgba(210, 180, 140, 0.5)', // dirt/obstacle
}

// ─────────────────────────────────────────────────────────────
// Refs / State
// ─────────────────────────────────────────────────────────────
const containerRef = ref<HTMLDivElement | null>(null)
let stage: Konva.Stage | null = null
let gridLayer: Konva.Layer | null = null
let tokenLayer: Konva.Layer | null = null
let highlightLayer: Konva.Layer | null = null

// Local copy of units for internal state (position updates)
const unitsLocal = ref<UnitToken[]>([])

// Currently selected/dragged player unit
const selectedUnitId = ref<string | null>(null)
const dragStartPos = ref<{ x: number; y: number } | null>(null)

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function cellCenter(cellX: number, cellY: number) {
  return {
    x: cellX * CELL_SIZE + CELL_SIZE / 2,
    y: cellY * CELL_SIZE + CELL_SIZE / 2,
  }
}

function pixelToCell(px: number, py: number) {
  return {
    x: Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(px / CELL_SIZE))),
    y: Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(py / CELL_SIZE))),
  }
}

function manhattanDistance(ax: number, ay: number, bx: number, by: number) {
  return Math.abs(ax - bx) + Math.abs(ay - by)
}

function getUnitMoveRange(unit: UnitToken) {
  return unit.moves ?? props.maxMoves
}

// ─────────────────────────────────────────────────────────────
// Drawing
// ─────────────────────────────────────────────────────────────
function drawGrid() {
  if (!gridLayer) return
  gridLayer.destroyChildren()

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const terrainType = props.mapData[row]?.[col] ?? 0
      const rect = new Konva.Rect({
        x: col * CELL_SIZE,
        y: row * CELL_SIZE,
        width: CELL_SIZE,
        height: CELL_SIZE,
        fill: TERRAIN_COLORS[terrainType] ?? TERRAIN_COLORS[0],
        stroke: 'rgba(0,0,0,0.3)',
        strokeWidth: 1,
      })
      // Click handler for cell
      rect.on('click tap', () => {
        emit('cell-clicked', { x: col, y: row })
      })
      gridLayer.add(rect)
    }
  }
  gridLayer.batchDraw()
}

function drawHighlights(originX: number, originY: number, range: number) {
  if (!highlightLayer) return
  highlightLayer.destroyChildren()

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const dist = manhattanDistance(originX, originY, col, row)
      if (dist > 0 && dist <= range) {
        const rect = new Konva.Rect({
          x: col * CELL_SIZE,
          y: row * CELL_SIZE,
          width: CELL_SIZE,
          height: CELL_SIZE,
          fill: 'rgba(100, 149, 237, 0.35)', // cornflower blue highlight
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

function drawTokens() {
  if (!tokenLayer) return
  tokenLayer.destroyChildren()

  for (const unit of unitsLocal.value) {
    const { x: cx, y: cy } = cellCenter(unit.x, unit.y)
    const circle = new Konva.Circle({
      x: cx,
      y: cy,
      radius: CELL_SIZE / 2 - 6,
      fill: unit.color,
      stroke: unit.isPlayer ? '#fff' : '#222',
      strokeWidth: 3,
      draggable: unit.isPlayer,
      id: unit.id,
      shadowColor: 'black',
      shadowBlur: 4,
      shadowOffset: { x: 2, y: 2 },
      shadowOpacity: 0.4,
    })

    // Click handler
    circle.on('click tap', (e) => {
      e.cancelBubble = true
      if (!unit.isPlayer) {
        alert(`Unité ennemie cliquée: ${unit.id}`)
        emit('unit-clicked', unit)
      }
    })

    if (unit.isPlayer) {
      // Drag start
      circle.on('dragstart', () => {
        selectedUnitId.value = unit.id
        dragStartPos.value = { x: unit.x, y: unit.y }
        const range = getUnitMoveRange(unit)
        drawHighlights(unit.x, unit.y, range)
        circle.moveToTop()
      })

      // Drag move — clamp inside stage
      circle.on('dragmove', () => {
        const pos = circle.position()
        const clampedX = Math.max(CELL_SIZE / 2, Math.min(STAGE_SIZE - CELL_SIZE / 2, pos.x))
        const clampedY = Math.max(CELL_SIZE / 2, Math.min(STAGE_SIZE - CELL_SIZE / 2, pos.y))
        circle.position({ x: clampedX, y: clampedY })
      })

      // Drag end — snap with lerp
      circle.on('dragend', () => {
        const pos = circle.position()
        const targetCell = pixelToCell(pos.x, pos.y)
        const startCell = dragStartPos.value ?? { x: unit.x, y: unit.y }
        const dist = manhattanDistance(startCell.x, startCell.y, targetCell.x, targetCell.y)
        const range = getUnitMoveRange(unit)

        let finalCell: { x: number; y: number }
        if (dist <= range) {
          finalCell = targetCell
        } else {
          // Move is invalid — snap back
          finalCell = startCell
        }

        const { x: fx, y: fy } = cellCenter(finalCell.x, finalCell.y)

        // Animate snap (lerp)
        circle.to({
          x: fx,
          y: fy,
          duration: 0.2,
          easing: Konva.Easings.EaseOut,
          onFinish: () => {
            // Update local state
            const idx = unitsLocal.value.findIndex((u) => u.id === unit.id)
            if (idx !== -1) {
              unitsLocal.value[idx] = { ...unitsLocal.value[idx], x: finalCell.x, y: finalCell.y }
            }
            // Emit only if moved
            if (finalCell.x !== startCell.x || finalCell.y !== startCell.y) {
              emit('unit-moved', { id: unit.id, x: finalCell.x, y: finalCell.y })
            }
            clearHighlights()
            selectedUnitId.value = null
            dragStartPos.value = null
          },
        })
      })
    }

    tokenLayer.add(circle)
  }
  tokenLayer.batchDraw()
}

// ─────────────────────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────────────────────
function initKonva() {
  if (!containerRef.value) return

  stage = new Konva.Stage({
    container: containerRef.value,
    width: STAGE_SIZE,
    height: STAGE_SIZE,
  })

  // Background layer (map image)
  const bgLayer = new Konva.Layer()
  stage.add(bgLayer)

  const bgImage = new Image()
  bgImage.src = props.backgroundImage
  bgImage.onload = () => {
    const konvaImg = new Konva.Image({
      image: bgImage,
      x: 0,
      y: 0,
      width: STAGE_SIZE,
      height: STAGE_SIZE,
    })
    bgLayer.add(konvaImg)
    bgLayer.moveToBottom()
    bgLayer.batchDraw()
  }

  // Grid layer
  gridLayer = new Konva.Layer()
  stage.add(gridLayer)

  // Highlight layer (for reachable cells)
  highlightLayer = new Konva.Layer()
  stage.add(highlightLayer)

  // Token layer
  tokenLayer = new Konva.Layer()
  stage.add(tokenLayer)

  // Initial draw
  drawGrid()
  drawTokens()
}

// ─────────────────────────────────────────────────────────────
// Lifecycle
// ─────────────────────────────────────────────────────────────
onMounted(() => {
  // Clone units to local state
  unitsLocal.value = props.units.map((u) => ({ ...u }))
  initKonva()
})

onUnmounted(() => {
  stage?.destroy()
})

// Watch for prop changes
watch(
  () => props.units,
  (newUnits) => {
    unitsLocal.value = newUnits.map((u) => ({ ...u }))
    drawTokens()
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
  <div ref="containerRef" class="combat-grid-container"></div>
</template>

<style scoped>
.combat-grid-container {
  width: 420px;
  height: 420px;
  border: 2px solid #333;
  border-radius: 4px;
  overflow: hidden;
  background: #1a1a2e;
}
</style>
