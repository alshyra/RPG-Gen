<template>
  <input
    type="text"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    class="block w-full rounded border border-slate-700 bg-slate-800/60 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
    v-bind="$attrs"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  >
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
}>();

defineEmits<(e: 'update:modelValue', value: string) => void>();
</script>
