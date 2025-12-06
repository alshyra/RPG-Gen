<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    @click.self="close"
  >
    <div class="bg-slate-800 rounded-lg p-8 max-w-md w-full border border-slate-600 shadow-2xl">
      <!-- header slot (falls back to title prop when provided) -->
      <header class="mb-4 flex items-start justify-between">
        <slot name="header">
          <div
            v-if="title"
            class="text-lg font-semibold text-slate-100"
          >
            {{ title }}
          </div>
        </slot>
        <button
          aria-label="close"
          class="ml-4 text-slate-400 hover:text-slate-200"
          @click="close"
        >
          ✕
        </button>
      </header>

      <div class="modal-body">
        <slot />
      </div>

      <!-- footer slot (falls back to confirm/cancel buttons) -->
      <footer class="mt-6">
        <slot name="footer">
          <div class="flex justify-end gap-2">
            <button
              data-cy="modal-cancel"
              class="px-3 py-1 rounded bg-slate-700 text-slate-200 hover:bg-slate-600"
              @click="handleCancel"
            >
              Annuler
            </button>

            <button
              data-cy="modal-confirm"
              class="px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700"
              @click="handleConfirm"
            >
              Confirmer
            </button>
          </div>
        </slot>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean;
  title?: string;
}

interface Emits {
  close: [];
  confirm: [];
  cancel: [];
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const close = () => emit('close');
const handleConfirm = () => {
  emit('confirm');
  emit('close');
};
const handleCancel = () => {
  emit('cancel');
  emit('close');
};
</script>

<style scoped></style>
