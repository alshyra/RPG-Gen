<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    @click.self="close"
  >
    <div class="bg-slate-800 rounded-lg p-8 max-w-md w-full border border-slate-600 shadow-2xl">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props { isOpen: boolean }

interface Emits { close: [] }

defineProps<Props>();
const emit = defineEmits<Emits>();

const close = () => emit('close');
</script>

<style scoped></style>
