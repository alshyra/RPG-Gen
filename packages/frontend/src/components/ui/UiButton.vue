<template>
  <button
    :class="['inline-flex items-center px-3 py-1 rounded-md font-semibold shadow-sm transition-opacity', buttonClass]"
    :disabled="isLoading || disabled"
    v-bind="$attrs"
  >
    <svg
      v-if="isLoading"
      class="animate-spin -ml-1 mr-2 h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ variant?: 'primary' | 'ghost'; isLoading?: boolean; disabled?: boolean }>();

const variantClass = computed(() => {
  if (props.variant === 'ghost') return 'bg-white/10 text-white';
  return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
});

const buttonClass = computed(() => {
  const classes = [variantClass.value];
  if (props.isLoading || props.disabled) {
    classes.push('opacity-50 cursor-not-allowed');
  } else {
    classes.push('cursor-pointer hover:opacity-90');
  }
  return classes.join(' ');
});
</script>
