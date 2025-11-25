<template>
  <div
    class="animate-pulse bg-slate-700/50 rounded"
    :class="sizeClasses"
    role="status"
    aria-label="Loading"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  variant?: 'text' | 'avatar' | 'card';
  lines?: number;
}>(), {
  variant: 'text',
  lines: 1,
});

const sizeClasses = computed(() => {
  switch (props.variant) {
    case 'avatar':
      return 'h-12 w-12 rounded-full';
    case 'card':
      return 'h-24 w-full';
    case 'text':
    default:
      return 'h-4 w-full';
  }
});
</script>

<style scoped>
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
