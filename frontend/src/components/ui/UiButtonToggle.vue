<template>
  <div class="flex gap-2">
    <UiButton
      v-for="option in options"
      :key="option.value"
      :variant="modelValue === option.value ? 'primary' : 'ghost'"
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import UiButton from './UiButton.vue';

interface Option {
  value: string | number;
  label: string;
}

defineProps<{
  isSelected?: boolean; // For backward compatibility
  options?: Option[]; // List of toggle options
  modelValue?: string | number; // Currently selected value
}>();

defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
}>();
</script>
