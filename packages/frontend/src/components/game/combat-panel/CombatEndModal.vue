<template>
  <UiModal
    :is-open="isOpen"
    @close="handleClose"
    class="combat-end-modal"
  >
    <template #header>
      <div class="modal-header">
        <h2>🏆 Victoire!</h2>
      </div>
    </template>

    <template #content>
      <div class="modal-content">
        <!-- Narrative text -->
        <div class="narrative-box">
          <p class="narrative-text">{{ narrative }}</p>
        </div>
      </div>
    </template>

    <template #footer>
      <UiButton
        @click="handleClose"
        variant="primary"
      >
        Continuer
      </UiButton>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import UiModal from '@/components/ui/UiModal.vue';
import UiButton from '@/components/ui/UiButton.vue';

withDefaults(
  defineProps<{
    isOpen: boolean;
    narrative: string;
  }>(),
  {
    isOpen: false,
    narrative: '',
  },
);

const emit = defineEmits<{
  close: [];
}>();

const handleClose = () => {
  emit('close');
};
</script>

<style scoped>
.combat-end-modal {
  --modal-max-width: 600px;
}

.modal-header {
  text-align: center;
  padding: 24px 0;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0) 100%);
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
}

.modal-header h2 {
  margin: 0;
  font-size: 28px;
  color: #ffd700;
  text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
  font-weight: 700;
}

.modal-content {
  padding: 32px 24px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.narrative-box {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 215, 0, 0.2);
  border-radius: 12px;
  padding: 24px;
  box-shadow: inset 0 2px 8px rgba(255, 215, 0, 0.1);
}

.narrative-text {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  color: #e0e0e0;
  font-style: italic;
  text-align: justify;
}
</style>
