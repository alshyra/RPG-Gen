<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'

// ─────────────────────────────────────────────────────────────
// Props & Emits
// ─────────────────────────────────────────────────────────────
const props = withDefaults(
  defineProps<{
    /** Screen X coordinate */
    x: number
    /** Screen Y coordinate */
    y: number
    /** Available attack options */
    options: string[]
    /** Whether this menu is visible */
    visible: boolean
    /** Default choice (used for auto-select timeout) */
    defaultChoice?: string
    /** Auto-select timeout in ms (0 to disable) */
    autoSelectTimeout?: number
  }>(),
  {
    defaultChoice: 'Sword',
    autoSelectTimeout: 3000,
  }
)

const emit = defineEmits<{
  (e: 'choose', option: string): void
  (e: 'cancel'): void
}>()

// ─────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────
const menuRef = ref<HTMLDivElement | null>(null)
let autoSelectTimer: ReturnType<typeof setTimeout> | null = null

// ─────────────────────────────────────────────────────────────
// Computed position (keep menu within viewport)
// ─────────────────────────────────────────────────────────────
const menuStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
}))

// ─────────────────────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────────────────────
function choose(option: string) {
  clearAutoTimer()
  emit('choose', option)
}

function handleClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    emit('cancel')
  }
}

function clearAutoTimer() {
  if (autoSelectTimer) {
    clearTimeout(autoSelectTimer)
    autoSelectTimer = null
  }
}

function startAutoTimer() {
  clearAutoTimer()
  if (props.autoSelectTimeout > 0 && props.defaultChoice) {
    autoSelectTimer = setTimeout(() => {
      emit('choose', props.defaultChoice)
    }, props.autoSelectTimeout)
  }
}

// ─────────────────────────────────────────────────────────────
// Lifecycle
// ─────────────────────────────────────────────────────────────
onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  clearAutoTimer()
})

watch(
  () => props.visible,
  (vis) => {
    if (vis) {
      startAutoTimer()
    } else {
      clearAutoTimer()
    }
  },
  { immediate: true }
)

// Icon map for attack types
const attackIcons: Record<string, string> = {
  Sword: '⚔️',
  Bow: '🏹',
  Stave: '🪄',
  Throw: '🎯',
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="attack-menu"
      :style="menuStyle"
    >
      <div class="attack-menu-title">Attaque</div>
      <button
        v-for="opt in options"
        :key="opt"
        class="attack-option"
        @click="choose(opt)"
      >
        <span class="attack-icon">{{ attackIcons[opt] ?? '❓' }}</span>
        <span class="attack-label">{{ opt }}</span>
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.attack-menu {
  position: fixed;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.95);
  border: 2px solid #4f46e5;
  border-radius: 8px;
  padding: 8px;
  min-width: 120px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.attack-menu-title {
  color: #a5b4fc;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 4px;
}

.attack-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 4px;
  color: #e2e8f0;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.attack-option:hover {
  background: rgba(79, 70, 229, 0.4);
  transform: translateX(4px);
}

.attack-icon {
  font-size: 18px;
}

.attack-label {
  font-weight: 500;
}
</style>
