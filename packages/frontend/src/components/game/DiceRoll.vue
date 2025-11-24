<template>
  <div>
    <UiButton
      variant="primary"
      :is-loading="isLoading || props.isSending"
      @click="onClick"
    >
      {{ props.pendingInstruction?.roll ? 'Roll 🎲' : 'Envoyer' }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore';
import UiButton from '../ui/UiButton.vue';
import { type GameInstruction } from '@rpg-gen/shared';
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'send'): void;
}>();

const props = defineProps<{ pendingInstruction?: GameInstruction | null; expr: string; isSending?: boolean }>();

const gameStore = useGameStore();
const isLoading = ref(false);

const send = async () => emit('send');

const onClick = async () => {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    if (props.pendingInstruction?.roll) {
      // Get advantage/disadvantage from the game instruction
      const advantage = props.pendingInstruction.roll.advantage || 'none';
      await gameStore.doRoll(props.expr, advantage);
    } else {
      await send();
    }
  } finally {
    isLoading.value = false;
  }
};

// keep script minimal
</script>
