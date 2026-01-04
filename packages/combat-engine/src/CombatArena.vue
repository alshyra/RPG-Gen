<template>
  <div
    class="combat-arena"
    data-cy="combat-arena"
  >
    <div
      ref="pixiContainer"
      class="pixi-container"
      data-cy="combat-canvas-container"
    />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type * as PIXI from 'pixi.js';
import { useCombat } from './composable/useCombat';

const props = withDefaults(
  defineProps<{
    /** Si true, n'initialise pas automatiquement (laisse le parent gérer) */
    manualInit?: boolean;
  }>(),
  {
    manualInit: true,
  },
);

// Utiliser le composable
const combat = useCombat();
const { init, createUnit, setupDragEvents, updateUnitHealth, updateUnitMoveRange, on, off, emit, moveUnitToGrid } =
  combat;
const appRef = ref<PIXI.Application | null>(null);

// Références
const pixiContainer = ref<HTMLDivElement | null>(null);

// Initialisation au montage (demo mode si pas manualInit)
onMounted(async () => {
  if (!pixiContainer.value || props.manualInit) return;

  // Demo initialization
  await init(pixiContainer.value);
  appRef.value = combat.getApp();
  await createUnit('player', 6, 4, 3, 'Archer-Green', 100, 100, true);
  await createUnit('enemy-1', 2, 4, 3, 'Warrior-Red', 80, 100, false);
  setupDragEvents();
});

// Cleanup on unmount to prevent memory leaks
onBeforeUnmount(() => {
  if (appRef.value) {
    try {
      appRef.value.destroy(true, { children: true, texture: false, textureSource: false });
    } catch {
      // Already destroyed
    }
  }
});

// Expose l'API complète pour le parent
defineExpose({
  // Lifecycle
  init: async (container?: HTMLDivElement) => {
    const target = container ?? pixiContainer.value;
    if (!target) throw new Error('No container for CombatArena init');
    await init(target);
    appRef.value = combat.getApp();
    return;
  },

  // Unit management
  createUnit,
  clearAllUnits: async () => {
    if (combat && combat.clearAllUnits) await combat.clearAllUnits();
  },
  updateUnitHealth,
  updateUnitMoveRange,
  moveUnitToGrid,
  setupDragEvents,

  // Event API
  on,
  off,
  emit,

  // Access to container ref
  getContainer: () => pixiContainer.value,

  // Get unit count for testing
  getUnitCount: () => {
    // Count units that have been created in the scene
    const app = combat.getApp();
    if (!app) return 0;
    const stage = app.stage;

    // Filter for CombatUnit sprites (they have zIndex set)
    let unitCount = 0;
    stage.children.forEach((child: unknown) => {
      const obj = child as unknown as { zIndex?: unknown };
      if ('zIndex' in (child as object) && typeof obj.zIndex === 'number') {
        unitCount++;
      }
    });
    return unitCount;
  },
});
</script>

<style scoped>
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
