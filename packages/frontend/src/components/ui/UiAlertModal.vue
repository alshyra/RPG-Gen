<template>
  <UiModal
    :is-open="state.isOpen"
    @close="handleCancel"
  >
    <div class="space-y-4">
      <div
        v-if="state.title"
        class="text-lg font-semibold text-slate-100"
      >
        {{ state.title }}
      </div>
      <div class="text-sm text-slate-200 whitespace-pre-wrap">
        {{ state.message }}
      </div>

      <div class="flex justify-end pt-4">
        <button
          v-if="state.type === 'confirm'"
          class="px-3 py-1 mr-2 rounded bg-slate-700 text-slate-200 hover:bg-slate-600"
          data-cy="modal-cancel"
          @click="handleCancel"
        >
          Annuler
        </button>

        <button
          class="px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700"
          data-cy="modal-ok"
          @click="handleOk"
        >
          OK
        </button>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import UiModal from './UiModal.vue';
import { useModalState, _resolveModal } from '@/composables/useModal';

const state = useModalState();

const handleOk = () => {
  _resolveModal(true);
};

const handleCancel = () => {
  _resolveModal(false);
};
</script>

<style scoped></style>
