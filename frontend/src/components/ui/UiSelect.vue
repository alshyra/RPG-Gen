<template>
  <select
    :value="modelValue"
    class="block w-full rounded border border-slate-700 bg-slate-800/60 p-2 text-slate-100 cursor-pointer hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    @change="(e) => $emit('update:modelValue', (e.target as HTMLSelectElement).value)"
  >
    <slot />
  </select>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
}>();

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>
