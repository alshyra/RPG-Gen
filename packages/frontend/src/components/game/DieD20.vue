<template>
  <div
    class="die-wrapper"
    :class="{ 'crit-success': value === 20, 'crit-fail': value === 1 }"
    :style="{ width: size + 'px', height: size + 'px' }"
    :data-cy="dataCy"
  >
    <div class="d20-value">
      {{ displayValue }}
    </div>
    <div
      class="d20-image"
      aria-hidden
    >
      <img
        class="d20-raster"
        src="/images/d20.png"
        alt="D20 die"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{
  value?: number | null;
  size?: number;
  dataCy?: string;
}>();

const { value } = props;
const displayValue = computed(() => (value != null ? String(value) : '-'));

const size = props.size ?? 88;
const dataCy = props.dataCy ?? 'd20';
</script>

<style scoped>
.die-wrapper { display:flex; align-items:center; justify-content:center; position: relative; }
.d20-image { width: 100%; height: 100%; display:flex; align-items:center; justify-content:center; position: relative; overflow: hidden; border-radius: 12px; }
.d20-raster { width: 100%; height: 100%; object-fit: cover; filter: drop-shadow(0 6px 16px rgba(0,0,0,0.6)); display:block; }
.d20-value { position: absolute; z-index: 6; font-weight: 700; font-family: Inter, system-ui, sans-serif; pointer-events: none; user-select: none; display:inline-block; }
.d20-value:hover { transform: scale(1.15) translateY(-2px); transition: transform .18s ease; }
.d20-image:hover .d20-raster { transform: scale(1.15) translateY(-2px); transition: transform .18s ease; }

/* critical success: green glow + soft pulse */
.crit-success .d20-image { animation: d20-pulse 1.4s ease-in-out infinite; filter: drop-shadow(0 12px 36px rgba(34,197,94,0.45)); }
@keyframes d20-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

/* critical fail: shorter red shake with glow */
.crit-fail .d20-image { animation: d20-shake .6s ease-in-out 0s 2; filter: drop-shadow(0 12px 28px rgba(220,38,38,0.45)); }
@keyframes d20-shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-3px) rotate(-2deg); }
  50% { transform: translateX(3px) rotate(2deg); }
  75% { transform: translateX(-2px) rotate(-1deg); }
  100% { transform: translateX(0); }
}
</style>
