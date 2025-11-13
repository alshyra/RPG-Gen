<template>
  <UiButton
    :variant="isSelected ? 'primary' : 'ghost'"
    v-bind="$attrs"
  >
    <slot />
  </UiButton>
</template>

<script setup lang="ts">
import UiButton from './UiButton.vue';

defineProps<{
  isSelected: boolean;
}>();
</script>
