<template>
  <textarea
    :value="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    class="w-full p-3 rounded bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}>();

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>
