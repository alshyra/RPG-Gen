<template>
  <UiModal
    :is-open="state.isOpen"
    @close="handleCancel"
  >
    <template #header>
      <div
        v-if="state.title"
        class="text-lg font-semibold text-slate-100"
      >
        {{ state.title }}
      </div>
    </template>

    <div class="space-y-4">
      <div class="text-sm text-slate-200 whitespace-pre-wrap">
        {{ state.message }}
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end pt-4">
        <UiButton
          v-if="state.type === 'confirm'"
          variant="primary"
          data-cy="modal-cancel"
          @click="handleCancel"
        >
          Annuler
        </UiButton>

        <UiButton
          variant="secondary"
          data-cy="modal-ok"
          @click="handleOk"
        >
          OK
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import UiButton from './UiButton.vue';
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
