<template>
  <button
    :class="[
      'inline-flex items-center px-3 py-1 rounded-md font-semibold shadow-sm transition-opacity',
      [variantClass, buttonClass],
    ]"
    :disabled="isDisabled"
    :aria-disabled="isDisabled"
    v-bind="$attrs"
  >
    <UiLoader
      v-if="isLoading"
      inline
      size="sm"
      class="-ml-1 mr-2"
    />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import UiLoader from './UiLoader.vue';

const { variant = 'primary', isLoading = false, disabled = false } = defineProps<{
  variant?: 'primary' | 'ghost' | 'secondary';
  isLoading?: boolean;
  disabled?: boolean;
}>();

const variantClass = computed(() => {
  if (variant === 'ghost') return 'bg-white/10 text-white';
  if (variant === 'secondary') return 'bg-amber-500 text-white';
  return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
});

const isDisabled = computed(() => isLoading || disabled);
const buttonClass = computed(() => {
  if (isDisabled.value) {
    return 'opacity-50 cursor-not-allowed';
  }
  return 'cursor-pointer hover:opacity-90';
});
</script>
