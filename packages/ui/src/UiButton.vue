<template>
  <component
    :is="tag"
    :class="[
      'inline-flex items-center px-3 py-1 rounded-md font-semibold shadow-sm transition-opacity',
      buttonClass,
    ]"
    :disabled="tag === 'button' ? isDisabled : undefined"
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
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import UiLoader from './UiLoader.vue';

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'ghost' | 'secondary';
    isLoading?: boolean;
    disabled?: boolean;
    tag?: 'button' | 'a';
  }>(),
  {
    variant: 'primary',
    tag: 'button',
  }
);

const variantClass = computed(() => {
  if (props.variant === 'ghost') return 'bg-white/10 text-white';
  if (props.variant === 'secondary') return 'bg-amber-500 text-white';
  return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
});

const isDisabled = computed(() => props.isLoading || props.disabled);

const buttonClass = computed(() => {
  const classes = [variantClass.value];
  if (isDisabled.value) {
    classes.push('opacity-50 cursor-not-allowed');
  } else {
    classes.push('cursor-pointer hover:opacity-90');
  }
  return classes.join(' ');
});
</script>