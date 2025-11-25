<template>
  <div
    v-if="!inline"
    class="flex items-center justify-center"
    :class="containerPadding"
    role="img"
    aria-label="Loading"
  >
    <div :class="spinnerClass" />
  </div>
  <div
    v-else
    :class="spinnerClass"
    role="img"
    aria-label="Loading"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ size?: 'xs' | 'sm' | 'md' | 'lg'; inline?: boolean; colorClass?: string; padding?: boolean }>();

const size = props.size ?? 'md';
const inline = props.inline ?? false;
const colorClass = props.colorClass ?? 'border-indigo-500';
const padding = props.padding ?? true;

const spinnerClass = computed(() => {
  const sizes: Record<string, string> = {
    xs: 'h-3 w-3 border-b-2',
    sm: 'h-4 w-4 border-b-2',
    md: 'h-8 w-8 border-b-2',
    lg: 'h-10 w-10 border-b-2',
  };
  return `animate-spin rounded-full ${sizes[size]} ${colorClass}`;
});

const containerPadding = computed(() => (padding && !inline ? 'p-4' : 'p-0'));
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
