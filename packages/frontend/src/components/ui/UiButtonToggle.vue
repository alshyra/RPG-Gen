<template>
  <div class="flex gap-2">
    <UiButton
      v-for="option in options"
      :key="typeof option.value === 'string' || typeof option.value === 'number' ? option.value : String(option.value)"
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
  value: unknown;
  label: string;
}

defineProps<{
  options?: Option[]; // List of toggle options
  modelValue?: unknown; // Currently selected value
}>();

defineEmits<{
  (e: 'update:modelValue', value: unknown): void;
}>();
</script>
