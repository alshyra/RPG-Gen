<template>
  <div
    class="health-root"
    :class="{ 'is-beating': beating }"
    role="img"
    :aria-label="`PV: ${displayedHp}`"
  >
    <svg
      class="heart"
      viewBox="0 0 32 29.6"
      fill="currentColor"
      aria-hidden="true"
    >
      <!-- a slightly pointier heart path -->
      <path
        d="M23.6,0c-2.9,0-4.9,1.9-6.1,3.6C16.9,1.9,14.9,0,12,0C7.6,0,4,3.4,4,7.8c0,6.0,14,11.0,14,18.0c0-7.0,14-12.0,14-18.0C32,3.4,28.4,0,24,0H23.6z"
      />
    </svg>
    <div class="hp-text">
      {{ displayedHp }}
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref, watch, onMounted, computed,
} from 'vue';
const props = defineProps<{
  hp?: string | number;
  animate?: boolean;
}>();

const beating = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;

interface HpObject {
  current?: number;
  max?: number;
}

const displayedHp = computed(() => {
  const v = props.hp;
  if (v == null) return '';
  if (typeof v === 'object') {
    const hpObj = v as HpObject;
    if (hpObj.current != null && hpObj.max != null) return `${hpObj.current}/${hpObj.max}`;
    return JSON.stringify(v);
  }
  return String(v);
});

watch(() => props.hp, () => {
  if (!props.animate) return;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  // trigger a short beat animation when hp changes
  beating.value = true;
  timer = setTimeout(() => {
    beating.value = false;
    timer = null;
  }, 700);
});

onMounted(() => {
  if (!props.animate) return;
  beating.value = true;
  setTimeout(() => beating.value = false, 400);
});
</script>

<style scoped>
.health-root {
  position: relative;
  width: 56px;
  height: 50px;
  display: inline-block;
}

.heart {
  width: 100%;
  height: 100%;
  color: #ef4444;
  transition: transform 0.2s ease;
  transform-origin: 50% 50%;
}

.hp-text {
  position: absolute;
  left: 53%;
  top: 37%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  line-height: 1;
  text-align: center;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

.is-beating .heart {
  animation: beat 0.7s ease;
}

@keyframes beat {
  0% {
    transform: scale(1);
  }

  30% {
    transform: scale(1.28);
  }

  60% {
    transform: scale(0.96);
  }

  100% {
    transform: scale(1);
  }
}
</style>
