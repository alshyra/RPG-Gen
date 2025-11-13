<template>
  <input
    type="checkbox"
    :checked="checked"
    :disabled="disabled"
    class="rounded border border-slate-600 bg-slate-700 cursor-pointer accent-indigo-600"
    v-bind="$attrs"
    @change="$emit('change')"
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
