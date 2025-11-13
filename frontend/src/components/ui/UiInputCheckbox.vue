<template>
  <input
    type="checkbox"
    class="rounded border border-slate-600 bg-slate-700 cursor-pointer accent-indigo-600"
    v-bind="$attrs"
  >
</template>

<script setup lang="ts">
defineProps<{
  checked?: boolean;
  disabled?: boolean;
}>();

defineEmits<{
  (e: 'change'): void;
}>();
</script>
