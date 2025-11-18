<template>
  <div class="flex items-center gap-2">
    <UiButton
      variant="ghost"
      :disabled="disabled || (min !== undefined && modelValue !== undefined && modelValue <= min)"
      @click.prevent="decrement"
    >
      -
    </UiButton>
    <div class="w-12 text-center font-medium">
      {{ displayValue }}
    </div>
    <UiButton
      variant="ghost"
      :disabled="disabled || (max !== undefined && modelValue !== undefined && modelValue >= max)"
      @click.prevent="increment"
    >
      +
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import UiButton from './UiButton.vue';

const props = defineProps<{
  modelValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const displayValue = computed(() => props.modelValue ?? 0);
const stepValue = computed(() => props.step ?? 1);

const increment = () => {
  if (props.disabled) return;

  const current = props.modelValue ?? 0;
  let newValue = current + stepValue.value;

  if (props.max !== undefined) {
    newValue = Math.min(newValue, props.max);
  }

  emit('update:modelValue', newValue);
}

const decrement = () => {
  if (props.disabled) return;

  const current = props.modelValue ?? 0;
  let newValue = current - stepValue.value;

  if (props.min !== undefined) {
    newValue = Math.max(newValue, props.min);
  }

  emit('update:modelValue', newValue);
}
</script>
