<template>
  <div
    v-if="isOpen"
    class="action-menu-overlay"
    :style="{ top: `${y}px`, left: `${x}px` }"
  >
    <div class="action-menu-content">
      <button
        class="action-menu-item"
        @click="handleAttack"
      >
        Attaque
      </button>
      <button
        class="action-menu-item"
        @click="handleSpell"
      >
        Sorts
      </button>
      <button
        class="action-menu-item action-menu-close"
        @click="handleClose"
      >
        Fermer
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CombatantDto } from '@rpg-gen/shared';

interface Props {
  isOpen: boolean;
  unitId?: string;
  x: number;
  y: number;
  selectedTarget?: CombatantDto | null;
}

const props = withDefaults(defineProps<Props>(), {
  x: 0,
  y: 0,
});

const emit = defineEmits<{
  close: [];
  attack: [];
  spell: [];
}>();

const handleAttack = () => {
  emit('attack');
};

const handleSpell = () => {
  emit('spell');
};

const handleClose = () => {
  emit('close');
};
</script>

<style scoped>
.action-menu-overlay {
  position: fixed;
  z-index: 100;
  pointer-events: auto;
}

.action-menu-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background-color: rgba(15, 23, 42, 0.95);
  border: 2px solid rgb(148, 163, 184);
  border-radius: 0.375rem;
  padding: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.action-menu-item {
  padding: 0.5rem 1rem;
  background-color: rgb(30, 41, 59);
  color: rgb(226, 232, 240);
  border: 1px solid rgb(71, 85, 105);
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 100px;
  text-align: left;
}

.action-menu-item:hover {
  background-color: rgb(51, 65, 85);
  border-color: rgb(100, 116, 139);
  transform: scale(1.05);
}

.action-menu-item:active {
  background-color: rgb(71, 85, 105);
}

.action-menu-close {
  color: rgb(248, 113, 113);
  border-color: rgb(239, 68, 68);
}

.action-menu-close:hover {
  background-color: rgba(239, 68, 68, 0.2);
  border-color: rgb(248, 113, 113);
}
</style>
