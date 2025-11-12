<template>
  <button
    :class="['inline-flex items-center px-3 py-1 rounded-md font-semibold shadow-sm', variantClass]"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ variant?: 'primary' | 'ghost' }>();
const variantClass = computed(() => {
  if (props.variant === 'ghost') return 'bg-white/10 text-white';
  return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
});
</script>
