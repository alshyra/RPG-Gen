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
import { ref, onMounted } from 'vue';
import { useCombat } from './composable/useCombat';

// Props optionnelles pour configuration externe
export interface CombatArenaProps {
  /** Si true, n'initialise pas automatiquement (laisse le parent gérer) */
  manualInit?: boolean;
}

const props = withDefaults(defineProps<CombatArenaProps>(), {
  manualInit: true,
});

// Utiliser le composable
const pixiCombat = useCombat();
const { init, createUnit, setupDragEvents, updateUnitHealth, on, off, emit, moveUnitToGrid } =
  pixiCombat;

// Références
const pixiContainer = ref<HTMLDivElement | null>(null);

// Initialisation au montage (demo mode si pas manualInit)
onMounted(async () => {
  if (!pixiContainer.value || props.manualInit) return;

  // Demo initialization
  await init(pixiContainer.value);
  await createUnit('player', 6, 4, 3, 'Archer-Green', 100, 100);
  await createUnit('enemy-1', 2, 4, 3, 'Warrior-Red', 80, 100);
  setupDragEvents();
});

// Expose l'API complète pour le parent
defineExpose({
  // Lifecycle
  init: async (container?: HTMLDivElement) => {
    const target = container ?? pixiContainer.value;
    if (!target) throw new Error('No container for CombatArena init');
    return init(target);
  },

  // Unit management
  createUnit,
  updateUnitHealth,
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
    const stage = pixiCombat.app?.value?.stage;
    if (!stage) return 0;
    
    // Filter for CombatUnit sprites (they have zIndex set)
    let unitCount = 0;
    stage.children.forEach(child => {
      if ('zIndex' in child && typeof (child as any).zIndex === 'number') {
        unitCount++;
      }
    });
    return unitCount;
  },
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
